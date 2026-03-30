import dataclasses
import enum
import logging
import socket
from pathlib import Path

import tyro

# Patch load_pytorch to handle dtype mismatches and tied weights across
# different safetensors / transformers versions (e.g. 25.09 vs 26.01 containers).
import safetensors.torch as _st
from openpi.models_pytorch import pi0_pytorch as _pi0pt

def _load_pytorch_patched(self, train_config, weight_path: str):
    model = _pi0pt.PI0Pytorch(config=train_config.model)
    state_dict = _st.load_file(weight_path)
    model.load_state_dict(state_dict, strict=False)
    return model

import openpi.models.model as _model_mod
for _cls in vars(_model_mod).values():
    if isinstance(_cls, type) and hasattr(_cls, "load_pytorch"):
        _cls.load_pytorch = _load_pytorch_patched

from openpi.policies import policy as _policy
from openpi.policies import policy_config as _policy_config
from openpi.serving import websocket_policy_server
from openpi.training import config as _config

try:
    from openpi_on_thor.trt_model_forward import setup_pi0_tensorrt_engine

    TENSORRT_AVAILABLE = True
except ImportError:
    TENSORRT_AVAILABLE = False


class EnvMode(enum.Enum):
    """Supported environments."""

    ALOHA = "aloha"
    ALOHA_SIM = "aloha_sim"
    DROID = "droid"
    LIBERO = "libero"


@dataclasses.dataclass
class Checkpoint:
    """Load a policy from a trained checkpoint."""

    # Training config name (e.g., "pi0_aloha_sim").
    config: str
    # Checkpoint directory (e.g., "checkpoints/pi0_aloha_sim/exp/10000").
    dir: str


@dataclasses.dataclass
class Default:
    """Use the default policy for the given environment."""


@dataclasses.dataclass
class Args:
    """Arguments for the serve_policy script."""

    # Environment to serve the policy for. This is only used when serving default policies.
    env: EnvMode = EnvMode.ALOHA_SIM

    # If provided, will be used in case the "prompt" key is not present in the data, or if the model doesn't have a default
    # prompt.
    default_prompt: str | None = None

    # Port to serve the policy on.
    port: int = 8000
    # Record the policy's behavior for debugging.
    record: bool = False

    # Specifies how to load the policy. If not provided, the default policy for the environment will be used.
    policy: Checkpoint | Default = dataclasses.field(default_factory=Default)

    # TensorRT acceleration options
    use_tensorrt: bool = False
    # Path to TensorRT engine file (e.g., "model.engine")
    tensorrt_engine: str | None = None


# Default checkpoints that should be used for each environment.
DEFAULT_CHECKPOINT: dict[EnvMode, Checkpoint] = {
    EnvMode.ALOHA: Checkpoint(
        config="pi05_aloha",
        dir="gs://openpi-assets/checkpoints/pi05_base",
    ),
    EnvMode.ALOHA_SIM: Checkpoint(
        config="pi0_aloha_sim",
        dir="gs://openpi-assets/checkpoints/pi0_aloha_sim",
    ),
    EnvMode.DROID: Checkpoint(
        config="pi05_droid",
        dir="gs://openpi-assets/checkpoints/pi05_droid",
    ),
    EnvMode.LIBERO: Checkpoint(
        config="pi05_libero",
        dir="gs://openpi-assets/checkpoints/pi05_libero",
    ),
}


def create_default_policy(env: EnvMode, *, default_prompt: str | None = None) -> _policy.Policy:
    """Create a default policy for the given environment."""
    if checkpoint := DEFAULT_CHECKPOINT.get(env):
        return _policy_config.create_trained_policy(
            _config.get_config(checkpoint.config), checkpoint.dir, default_prompt=default_prompt
        )
    raise ValueError(f"Unsupported environment mode: {env}")


def create_policy(args: Args) -> _policy.Policy:
    """Create a policy from the given arguments."""
    match args.policy:
        case Checkpoint():
            checkpoint_dir = str(Path(args.policy.dir).expanduser())
            return _policy_config.create_trained_policy(
                _config.get_config(args.policy.config), checkpoint_dir, default_prompt=args.default_prompt
            )
        case Default():
            return create_default_policy(args.env, default_prompt=args.default_prompt)


def main(args: Args) -> None:
    policy = create_policy(args)
    policy_metadata = policy.metadata

    # Setup TensorRT acceleration if requested
    if args.use_tensorrt:
        if not TENSORRT_AVAILABLE:
            raise RuntimeError(
                "TensorRT support not available. Please install TensorRT and cuda-python:\n"
                "  pip install tensorrt cuda-python"
            )

        if args.tensorrt_engine:
            engine_path = Path(args.tensorrt_engine).expanduser()
        else:
            # Try to find engine in checkpoint directory
            if isinstance(args.policy, Checkpoint):
                checkpoint_dir = Path(args.policy.dir)
            else:
                checkpoint = DEFAULT_CHECKPOINT[args.env]
                checkpoint_dir = Path(checkpoint.dir)

            engine_path = checkpoint_dir / "model_fp16.engine"

        if not engine_path.exists():
            raise FileNotFoundError(
                f"TensorRT engine not found at {engine_path}\n"
                f"Please run ONNX export and TensorRT engine build first:\n"
                f"  python openpi_on_thor/pytorch_to_onnx.py ...\n"
                f"  bash openpi_on_thor/build_engine.sh ..."
            )

        logging.info("Setting up TensorRT acceleration from %s", engine_path)
        policy = setup_pi0_tensorrt_engine(
            policy,
            str(engine_path),
        )
        logging.info("✓ TensorRT acceleration enabled")

    # Record the policy's behavior.
    if args.record:
        policy = _policy.PolicyRecorder(policy, "policy_records")

    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    logging.info("Creating server (host: %s, ip: %s)", hostname, local_ip)

    server = websocket_policy_server.WebsocketPolicyServer(
        policy=policy,
        host="0.0.0.0",
        port=args.port,
        metadata=policy_metadata,
    )
    server.serve_forever()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, force=True)
    main(tyro.cli(Args))
