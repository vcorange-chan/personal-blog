# 新 Web VPS 初始化报告

日期：2026-06-05  
用途：公开 Web 服务，承载博客、TTS proxy，后续可承载 Umami  
新 VPS：Vultr Seoul，`vc2-1c-1gb`，Ubuntu 22.04 x64

## 1. 目标

本次目标是把公开 Web 服务从旧 VPN VPS 中拆出来：

- 新 VPS 承载：
  - Astro 静态博客。
  - `tts.cliffordchen.org` 的 TTS proxy。
  - 后续可能加入 Umami。
- 旧 VPS 保持低调，只继续承载：
  - VPN / sing-box。
  - 订阅服务。

本次没有修改旧 VPN VPS。

## 2. 新 VPS 信息

```text
Location: Seoul
IPv4: 141.164.39.98
IPv6: 2401:c080:1c01:0f67:5400:06ff:fe38:6e4b
Plan: vc2-1c-1gb
vCPU: 1
RAM: 1GB
Storage: 25GB SSD
OS: Ubuntu 22.04.5 LTS
Auto Backups: Enabled
Label: public-web-blog-tts
Hostname: clifford-web
```

## 3. 用户与 SSH

已完成：

- root SSH key 登录验证通过。
- 创建普通用户：

```text
clifford
```

- 将 root 的 SSH public key 复制给 `clifford`。
- 将 `clifford` 加入 `sudo` 组。
- 为 `clifford` 配置免密码 sudo：

```text
/etc/sudoers.d/90-clifford-nopasswd
```

- 禁用 SSH 密码登录。
- 禁用 root SSH 登录。

新增 SSH 加固文件：

```text
/etc/ssh/sshd_config.d/99-clifford-hardening.conf
```

内容：

```text
PasswordAuthentication no
PermitRootLogin no
KbdInteractiveAuthentication no
```

验证结果：

```text
clifford 用户 SSH key 登录成功
clifford 用户 sudo -n true 成功
ssh 服务 active
```

说明：

- 由于 root 密码曾经出现在聊天中，本次已关闭 root/password SSH 作为安全补救。

## 4. 防火墙

启用 UFW：

```text
Default: deny incoming, allow outgoing
```

当前允许：

```text
22/tcp via OpenSSH
80/tcp
443/tcp
```

IPv6 规则也已同步存在。

没有开放 TTS proxy 端口。

## 5. 系统工具

安装基础工具：

```text
ufw
curl
ca-certificates
gnupg
git
rsync
unzip
```

安装 Caddy 官方 apt 包：

```text
Caddy v2.11.4
```

安装 NodeSource Node.js：

```text
Node v22.22.3
npm 10.9.8
```

原因：

- Ubuntu 22.04 默认仓库的 Node.js 是 `12.22.9`，太旧。
- TTS proxy 需要现代 Node runtime。

## 6. 内存与磁盘

检查结果：

```text
Mem: 951Mi total, about 583Mi available
Swap: 2.3Gi total
Disk /: 23G total, 6.9G used, 15G available
```

说明：

- 1GB RAM 对 Astro 静态站和 TTS proxy 足够。
- Swap 可降低突发内存压力。

## 7. Caddy 当前配置

当前 Caddy 先通过 IPv4 HTTP 预览博客：

```caddyfile
http://141.164.39.98 {
	root * /var/www/cliffordchen.org
	file_server
	encode gzip
}
```

当前状态：

```text
caddy active
监听 *:80
```

暂时没有配置正式域名 TLS。

原因：

- 还没有切 Cloudflare DNS。
- 等新 VPS 验证完成后，再把 `cliffordchen.org`、`www`、`tts` 指向新 VPS，并让 Caddy 自动申请证书。

## 8. 博客部署

本地执行：

```powershell
npm run build
```

结果：

```text
16 page(s) built
build Complete
```

上传并解包到：

```text
/var/www/cliffordchen.org
```

验证：

```text
http://141.164.39.98/                                  200 OK
http://141.164.39.98/posts/lang/french/lecon-1-interactive/ 200 OK
```

## 9. TTS proxy 部署

部署目录：

```text
/opt/tts-proxy
```

运行用户：

```text
tts-worker
```

缓存目录：

```text
/var/cache/tts-proxy/audio
```

环境文件：

```text
/etc/tts-proxy.env
```

当前环境文件只含占位配置，不含真实 ElevenLabs API key。

systemd 服务：

```text
/etc/systemd/system/tts-proxy.service
```

当前状态：

```text
tts-proxy active
监听 127.0.0.1:8787
curl http://127.0.0.1:8787/health -> {"ok":true}
```

说明：

- TTS proxy 不对公网暴露端口。
- 后续通过 Caddy 反向代理 `tts.cliffordchen.org`。

## 10. 当前还未做

尚未切 DNS。

尚未在新 VPS 配置真实：

```text
ELEVENLABS_API_KEY
ELEVENLABS_DEFAULT_VOICE_ID
ELEVENLABS_ENGLISH_VOICE_ID
ELEVENLABS_FRENCH_VOICE_ID
ELEVENLABS_KOREAN_VOICE_ID
```

尚未配置正式域名 Caddy block：

```text
cliffordchen.org
www.cliffordchen.org
tts.cliffordchen.org
```

## 11. 下一步建议

1. 在 Cloudflare 中先不要动旧 VPN 相关记录。
2. 把新 VPS 加入本机 SSH config，例如：

```sshconfig
Host web-vps
    HostName 141.164.39.98
    User clifford
    Port 22
    ServerAliveInterval 30
    ServerAliveCountMax 4
```

3. 将真实 ElevenLabs 环境变量手动写入新 VPS：

```bash
sudo nano /etc/tts-proxy.env
sudo systemctl restart tts-proxy
```

4. 准备 DNS 切换：

```text
cliffordchen.org      -> 141.164.39.98
www.cliffordchen.org  -> 141.164.39.98
tts.cliffordchen.org  -> 141.164.39.98
```

5. DNS 生效后，更新 Caddyfile 为正式域名配置并 reload Caddy。

6. 验证：

```text
https://cliffordchen.org/
https://tts.cliffordchen.org/health
旧 VPN VPS 上 sing-box/sub 不受影响
```

