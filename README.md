# hnust-drcom-auth

HNUST 校园网认证插件，适用于 OpenWrt、ImmortalWrt 和基于它们的衍生固件。

插件通过校园网 Portal HTTP 接口完成认证，支持 LuCI 配置、开机自动认证、每日定时检查和认证日志查看。

## 功能

- 支持电信、移动、联通和校园网四种账号类型
- 自动读取指定网络接口当前的 IPv4 地址
- 支持手机和电脑两种终端类型
- 支持开机后自动认证
- 支持每天指定时间自动检查认证状态
- 支持 LuCI 页面查看认证日志
- 支持手动命令行认证和检查
- 支持 OpenWrt 稳定版 `.ipk` 和 SNAPSHOT `.apk`

## GitHub Actions 编译

进入仓库的 **Actions** 页面，运行 **Build campus-auth package**，选择：

- `24.10.5`：编译 `.ipk`，适用于 OpenWrt 24.10.x 等使用 IPK 的系统
- `SNAPSHOT`：编译 `.apk`，适用于使用 APK 包管理器的新版 OpenWrt

架构默认是 `x86_64`，也可以按设备选择 `aarch64_cortex-a53`、`aarch64_cortex-a72`、`aarch64_generic`、`mipsel_24kc` 或 `mips_24kc`。

编译完成后，在对应的 workflow run 页面下载 artifact。

## 安装

IPK 系统：

```sh
opkg install /tmp/luci-app-campus-auth_*.ipk
```

GitHub Actions 编译的 IPK 使用的是 OpenWrt SDK 的独立构建环境，不会使用你当前固件的发行签名密钥。因此某些 LibWrt、ImmortalWrt 或定制固件会提示“签名无效”。这不表示插件内容损坏，而是固件没有信任该构建环境的签名密钥。

如果固件仍检查签名，请在确认文件来源可信后使用固件支持的忽略签名选项安装，例如：

```sh
opkg install --force-signature /tmp/luci-app-campus-auth_*.ipk
```

不同固件的 `opkg` 选项可能不同，可以先查看：

```sh
opkg --help
```

APK 系统：

```sh
apk add --allow-untrusted /tmp/luci-app-campus-auth_*.apk
```

安装后刷新 LuCI 页面，在“服务”菜单中打开“校园网认证”。

## LuCI 配置

认证设置：

- 启用认证：总开关
- 开机自动认证：开机并等待网络初始化后自动执行一次认证
- 学号：填写校园网学号
- 密码：填写校园网密码
- 运营商：选择电信、移动、联通或校园网
- 认证网络接口：填写获取校园网 IPv4 的网络接口，通常为 `wan`
- 终端类型：手机选择 `手机`，电脑选择 `电脑`

每日检查时间：

- 启用每日检查
- 时：`0` 到 `23`
- 分：`0` 到 `59`

修改配置后点击“保存并应用”，插件会自动更新 cron 任务。

## 账号格式

插件根据运营商和终端类型生成 Portal 的 `user_account`：

| 运营商 | 手机 | 电脑 |
| --- | --- | --- |
| 电信 | `,1,学号@telecom` | `,0,学号@telecom` |
| 移动 | `,1,学号@cmcc` | `,0,学号@cmcc` |
| 联通 | `,1,学号@unicom` | `,0,学号@unicom` |
| 校园网 | `,1,学号` | `,0,学号` |

当前请求使用的固定参数包括：

- Portal 地址：`192.168.254.226:801`
- `login_method=1`
- `terminal_type` 根据终端类型选择 `1` 或 `2`
- `wlan_user_ip` 使用路由器当前 IPv4 地址
- `v=4149`

## 命令行使用

手动执行认证：

```sh
campus-auth login
```

检查认证状态：

```sh
campus-auth check
```

查看插件日志：

```sh
logread -e campus-auth
```

查看当前每日任务：

```sh
cat /etc/crontabs/root
```

手动重新生成定时任务：

```sh
/etc/init.d/campus-auth reload
```

## 返回值

Portal 返回 `result=0` 时表示当前 IP 已经在线，返回 `result=1` 时表示认证成功，其他响应均视为认证失败。
