# hnust-drcom-auth

HNUST 校园网认证插件，适用于 OpenWrt、ImmortalWrt 和基于它们的衍生固件。

插件通过校园网 Portal HTTP 接口完成认证，支持 LuCI 配置、开机自动认证、每日定时检查，以及直接在网页里手动触发一次登录检查。

## 功能

- 支持电信、移动、联通和校园网四种账号类型
- 自动读取指定网络接口当前的 IPv4 地址
- 支持手机和电脑两种终端类型
- 支持开机后自动认证
- 支持每天指定时间自动检查认证状态
- LuCI 页面提供“立即检查认证”按钮，无需登录 SSH 即可触发检查
- LuCI 页面显示检查结果、服务器说明和认证服务器给出的自助服务链接
- 正确识别“超出运营商允许的同时在线设备数上限”这类失败，不再误报为认证成功
- 支持 OpenWrt 稳定版 .ipk 和 SNAPSHOT .apk

## 安装

从 [Releases](https://github.com/dezige131/hnust-drcom-auth/releases) 下载与设备架构和固件版本对应的文件：

- .ipk：适用于 OpenWrt 24.10.x、ImmortalWrt 24.10 等使用 opkg 的固件
- .apk：适用于用 apk 管理软件包的新版 OpenWrt / ImmortalWrt

先确认设备架构，再下载对应文件：

    opkg print-architecture 2>/dev/null || cat /etc/apk/arch 2>/dev/null

IPK 固件：

    opkg install /tmp/luci-app-campus-auth_x86_64-24.10.5.ipk

APK 固件：

    apk add --allow-untrusted /tmp/luci-app-campus-auth_x86_64-SNAPSHOT.apk

安装后刷新 LuCI 页面，在“服务”菜单中打开“校园网认证”。

## 签名说明

### 两种包格式的签名机制不同

- IPK（opkg，24.10.x）：opkg 只校验软件源索引 Packages 的 usign 签名，安装包本身不签名，本地安装时只用索引里的 size 和 sha256 校验完整性。OpenWrt 的 scripts/ipkg-build 也不会给 .ipk 生成签名。
- APK（SNAPSHOT）：apk 每个包都带自己的签名，安装时按设备 /etc/apk/keys/ 里的公钥验证，验证失败就是 UNTRUSTED signature，只能用 --allow-untrusted 放行。

### 之前为什么会出现“签名无效”

两条路径都会踩到同一个坑：签名用的密钥只存在于构建机上。

- 走 APK 时：SDK 每次编译都会用 openssl 现场生成一对一次性密钥（BUILD_KEY_APK_SEC），并用它给每个 .apk 签名。这对密钥的私钥随容器销毁，公钥从来没有进过你的固件，所以设备无法验证，报“签名无效”。
- 走 IPK 并把它当软件源用时：make package/index 会用同样的一次性密钥（key-build）签名 Packages 索引，设备访问这个源时会因为公钥未知而拒绝。

这两者都不是安装包损坏，也无法通过重新打包绕过：apk/opkg 校验的是密钥，不是文件哈希。

### 现在做了什么、还能做什么

- 编译工作流不向构建环境传入任何签名密钥，也不会设置 INDEX=1 去生成并签名 Packages 索引，所以本仓库的产物不会出现“用别人不认识的密钥签名”的索引
- 插件本身没有能力让 apk 用你固件的密钥签名：签名密钥必须来自固件构建方，这一点无法在插件源码里修复，安装时用 --allow-untrusted 才是正确做法
- 真正能省掉这些麻烦的做法是随固件一起编译插件（把包放进固件源码树），这样安装包会用你固件自己的密钥签名，就不再有“签名无效”

### 安装时的正确姿势

IPK 固件（已确认 opkg 不会校验本地文件）：

    opkg install /tmp/luci-app-campus-auth_x86_64-24.10.5.ipk

APK 固件（apk 必须显式放行第三方签名）：

    apk add --allow-untrusted /tmp/luci-app-campus-auth_x86_64-SNAPSHOT.apk

如果 opkg 仍然报签名相关错误，按下面顺序排查：

1. 确认自己不是把这个仓库的产物加进了 /etc/opkg/customfeeds.conf 当软件源用；本地安装不需要、也不应该这样做。
2. 某些固件把 opkg 的签名检查改成了强制，可以在确认来源可信后尝试：

       opkg install --force-signature /tmp/luci-app-campus-auth_x86_64-24.10.5.ipk

3. 要把构建产物长期当软件源使用，必须把构建机的公钥放进固件的 /etc/opkg/keys/（文件名是公钥的 usign 指纹），或用 opkg 的 --verify-program 指定校验程序。
4. 如果报错出现在系统自带源的更新过程中，那与本插件无关，是该固件自身软件源的签名问题。

用一条命令可以确认设备用的是哪一种包管理器：

    opkg --version 2>/dev/null || cat /etc/apk/arch 2>/dev/null

## LuCI 使用

认证设置：

- 启用认证：总开关
- 开机自动认证：开机并等待网络初始化后自动执行一次认证
- 学号：填写校园网学号
- 密码：填写校园网密码
- 运营商：选择电信、移动、联通或校园网
- 认证网络接口：填写获取校园网 IPv4 的网络接口，通常为 wan
- 终端类型：手机选择 手机，电脑选择 电脑

每日检查时间：

- 启用每日检查
- 时：0 到 23
- 分：0 到 59

修改配置后点击“保存并应用”，插件会自动更新 cron 任务。

### 立即检查认证

页面下方的“认证检查”区域有一个“立即检查认证”按钮，点击后会执行一次 campus-auth check，效果等同于在 SSH 中执行同名命令：

- 按钮执行期间会禁用，避免重复提交
- 输出区显示认证服务器返回的原始响应、解析后的结果和失败原因
- 出现“在线设备数上限”时，输出区会给出处理建议，并列出服务器消息中的自助服务链接
- 状态行会说明本次检查是“已经在线 / 认证成功”还是“认证失败”
- 认证日志区域可以单独刷新，用于查看历史记录

按钮执行的是已经保存的配置。如果刚刚修改过学号、密码等设置，请先点击“保存并应用”再点击检查按钮。

如果点击后提示“权限不足”，说明固件里旧的 rpcd ACL 还在内存中，执行一次 /etc/init.d/rpcd restart（或重启设备）并刷新页面即可。

## 返回值的判定

认证服务器的响应是 dr1003({"result":...,"msg":"...","ret_code":...}); 形式的 JSONP。插件按下面的顺序判断：

1. ret_code=1 表示失败。即使 result 仍然是 0，也会判定为失败
2. 消息中包含“同时在线设备数”“在线设备数上限”“注销至少一个”等字样时，判定为超出在线设备数上限，并输出处理建议
3. 消息中包含“登录失败”“认证失败”“失败原因”时，判定为失败
4. 其余情况下，result=1 为认证成功，result=0 为当前 IP 已经在线
5. 无法解析出 result 时按失败处理

可以通过返回值区分：脚本返回 0 表示已经在线或认证成功，返回 1 表示失败。

## 编译

### 一次发布全部架构

不用手动管 tag：只要修改了 luci-app-campus-auth 目录并推送到 main，发布工作流就会自动跑起来。

tag 名由包的版本号推导，格式是 vPKG_VERSION-rPKG_RELEASE，例如当前 Makefile 里是

    PKG_VERSION:=1.1.0
    PKG_RELEASE:=1

推导出的 tag 就是 v1.1.0-r1。工作流会先检查这个 tag 在远端是否存在：

- 不存在：自动创建并推送该 tag，然后编译发布
- 已存在：说明这个版本已经发布过，本次推送直接跳过，不会重复编译，也不会覆盖已有的 Release

所以发新版本只需要改 Makefile：想发 1.2.0 就改 PKG_VERSION，同一个版本修 bug 就把 PKG_RELEASE 加一，然后提交推送到 main，其余交给工作流。

也可以在 Actions 页面手动运行 Release campus-auth packages：

- tag 填 auto（默认）：同上，按 Makefile 推导，缺失就自动创建
- tag 填具体值：必须是已存在的 tag，否则立即报错；填 1.1.0-r1 而仓库里是 v1.1.0-r1 时会自动补 v 前缀

手动运行时，工作流会按解析出的 tag 检出源码再编译，产物与自动触发完全一致。

编译内容：6 种架构 × 2 种包格式，共 12 个安装包，全部产物和 SHA256SUMS 上传到同名 GitHub Release：

- 架构：x86_64、aarch64_cortex-a53、aarch64_cortex-a72、aarch64_generic、mipsel_24kc、mips_24kc
- 格式：24.10.5（.ipk）与 SNAPSHOT（.apk）

产物统一命名为 luci-app-campus-auth_架构-分支.后缀，例如 luci-app-campus-auth_aarch64_cortex-a53-24.10.5.ipk。

如果只想改文档（例如只动 README），不会触发发布，因为工作流的推送过滤只盯着 luci-app-campus-auth 目录。

### 单独编译一个包

进入 Actions 页面运行 Build campus-auth package，选择版本（24.10.5 或 SNAPSHOT）和架构，编译完成后在该 workflow run 页面下载 artifact。

### 本地编译

把 luci-app-campus-auth 目录放进 OpenWrt 源码的 package 目录，或加入 feeds.conf 后：

    ./scripts/feeds update -a
    ./scripts/feeds install luci-app-campus-auth
    make menuconfig     # LuCI -> Applications -> luci-app-campus-auth
    make package/luci-app-campus-auth/compile V=s

## 无 LuCI 时通过命令行配置

通过 SSH 登录路由器，使用 UCI 设置学号、密码等参数。以下示例选择移动、手机终端、wan 接口，并在每天 03:00 检查；请将学号和密码替换为自己的信息：

    uci set campus-auth.main.enabled='1'
    uci set campus-auth.main.boot_auth_enabled='1'
    uci set campus-auth.main.student_id='你的学号'
    uci set campus-auth.main.password='你的密码'
    uci set campus-auth.main.login_method='2'
    uci set campus-auth.main.terminal_type='2'
    uci set campus-auth.main.interface='wan'
    uci set campus-auth.main.schedule_enabled='1'
    uci set campus-auth.main.schedule_hour='3'
    uci set campus-auth.main.schedule_minute='0'
    uci commit campus-auth
    /etc/init.d/campus-auth enable
    /etc/init.d/campus-auth reload
    campus-auth check

login_method 的取值：1 电信、2 移动、3 联通、4 校园网。terminal_type 的取值：1 电脑、2 手机。设为 boot_auth_enabled='0' 可关闭开机自动认证；设为 schedule_enabled='0' 可关闭每日检查。修改配置后都需要执行 uci commit campus-auth 和 /etc/init.d/campus-auth reload。

命令行输入的密码可能留在 Shell 历史记录中。不要向他人发送包含密码的命令或 uci show campus-auth 的完整输出。

## 账号格式

插件根据运营商和终端类型生成 Portal 的 user_account：

| 运营商 | 手机 | 电脑 |
| --- | --- | --- |
| 电信 | ,1,学号@telecom | ,0,学号@telecom |
| 移动 | ,1,学号@cmcc | ,0,学号@cmcc |
| 联通 | ,1,学号@unicom | ,0,学号@unicom |
| 校园网 | ,1,学号 | ,0,学号 |

当前请求使用的固定参数包括：

- Portal 地址：192.168.254.226:801
- login_method=1
- terminal_type 根据终端类型选择 1 或 2
- wlan_user_ip 使用路由器当前 IPv4 地址
- v=4149

## 命令行使用

手动执行认证：

    campus-auth login

检查认证状态：

    campus-auth check

查看插件日志：

    logread -e campus-auth

查看当前每日任务：

    cat /etc/crontabs/root

手动重新生成定时任务：

    /etc/init.d/campus-auth reload