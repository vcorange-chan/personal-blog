from pathlib import Path
import subprocess

path = Path('/etc/caddy/Caddyfile')
original = path.read_text()
marker = 'blog.cliffordchen.org {'
snippet = '''
    # Clifford CMS: authentication stays on the Seoul host.
    handle /cms/* {
        reverse_proxy 127.0.0.1:8790
    }
    @cms_admin path /admin /admin/*
    header @cms_admin {
        Cache-Control "no-store"
        X-Robots-Tag "noindex, nofollow"
        X-Frame-Options "DENY"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.github.com https://github.com https://raw.githubusercontent.com; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
    }
'''
updated = original
if '# Clifford CMS:' not in original:
    if original.count(marker) != 1:
        raise SystemExit('Expected one Seoul blog block; no configuration changed.')
    updated = original.replace(marker, marker + snippet, 1)
else:
    updated = original.replace("script-src 'self'; style-src", "script-src 'self' 'unsafe-eval'; style-src")
if updated != original:
    path.with_name('Caddyfile.before-blog-cms-update').write_text(original)
    path.write_text(updated)
    result = subprocess.run(['caddy', 'validate', '--config', str(path)])
    if result.returncode:
        path.write_text(original)
        raise SystemExit('Validation failed; original configuration restored.')
    subprocess.run(['systemctl', 'reload', 'caddy'], check=True)
    print('CMS reverse proxy configured; Caddy reloaded.')
else:
    print('CMS reverse proxy already configured.')
