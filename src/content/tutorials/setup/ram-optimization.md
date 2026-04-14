---
title: "RAM Optimization"
description: "Optimize system RAM usage on Jetson devices by disabling the desktop GUI, unnecessary services, and mounting swap for large model workloads."
category: "Setup"
section: "Environment Setup"
order: 4
tags: ["setup", "ram", "memory", "optimization", "swap", "jetson-orin-nano", "jetson"]
authors:
  - name: "Chitoku YATO"
    github: "tokk-nv"
---

Running large language models requires significant RAM. On devices like the **Jetson Orin Nano** with only 8 GB of RAM, it is crucial to free as much memory as possible for model inference.

Here are several ways to optimize system RAM usage.


## Disabling the Desktop GUI

If you access your Jetson remotely through SSH, you can disable the Ubuntu desktop GUI. This frees around **~800 MB** that the window manager and desktop normally consume.

### Temporarily disable/enable

```bash
sudo init 3     # stop the desktop
# log your user back into the console (Ctrl+Alt+F1, F2, etc.)
sudo init 5     # restart the desktop
```

### Persistent across reboots

To disable the desktop on boot:

```bash
sudo systemctl set-default multi-user.target
```

To re-enable the desktop on boot:

```bash
sudo systemctl set-default graphical.target
```


## Disabling Misc Services

Some system services are not needed for AI workloads and can be disabled to reclaim memory:

```bash
sudo systemctl disable nvargus-daemon.service
```


## Mounting Swap

If you're building containers or working with large models, it's advisable to mount swap space (typically correlated with the amount of memory on the board).

> If you have NVMe SSD storage available, it's preferred to allocate the swap file on the NVMe SSD.

Run these commands to disable ZRAM and create a swap file:

```bash
sudo systemctl disable nvzramconfig
sudo fallocate -l 16G /ssd/16GB.swap
sudo mkswap /ssd/16GB.swap
sudo swapon /ssd/16GB.swap
```

Then add the following line to the end of `/etc/fstab` to make the change persistent:

```
/ssd/16GB.swap  none  swap  sw 0  0
```
