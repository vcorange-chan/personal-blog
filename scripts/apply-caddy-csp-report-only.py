from pathlib import Path

CADDYFILE = Path("/etc/caddy/Caddyfile")

CSP_REPORT_ONLY = (
    'Content-Security-Policy-Report-Only "'
    "default-src 'self'; "
    "base-uri 'self'; "
    "object-src 'none'; "
    "frame-ancestors 'self'; "
    "img-src 'self' data: https:; "
    "font-src 'self' data:; "
    "style-src 'self' 'unsafe-inline' https://giscus.app; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://giscus.app; "
    "connect-src 'self' https://giscus.app https://api.github.com https://*.giscus.app; "
    "frame-src https://giscus.app"
    '"'
)


def add_report_only_to_static_site_blocks(text: str) -> str:
    marker = 'Permissions-Policy "geolocation=(), microphone=(), camera=()"'
    lines = text.splitlines()
    result: list[str] = []
    current_site = ""
    in_header_block = False
    header_indent = ""
    header_target_site = False
    header_has_report_only = False
    static_sites = {"http://141.164.39.98", "blog.cliffordchen.org", "cliffordchen.org, www.cliffordchen.org"}

    for line in lines:
        stripped = line.strip()
        if stripped.endswith("{") and stripped != "header {" and not in_header_block:
            current_site = stripped.removesuffix("{").strip()

        if stripped == "header {":
            in_header_block = True
            header_indent = line[: len(line) - len(line.lstrip())]
            header_target_site = current_site in static_sites
            header_has_report_only = False

        if in_header_block and header_target_site and stripped.startswith("Content-Security-Policy-Report-Only"):
            if header_has_report_only:
                continue
            header_has_report_only = True

        result.append(line)

        if in_header_block and header_target_site and stripped == marker and not header_has_report_only:
            result.append(f"{header_indent}\t{CSP_REPORT_ONLY}")
            header_has_report_only = True

        if in_header_block and stripped == "}":
            in_header_block = False
            header_target_site = False
            header_has_report_only = False

    return "\n".join(result) + "\n"


def main() -> None:
    original = CADDYFILE.read_text()
    updated = add_report_only_to_static_site_blocks(original)
    if updated == original:
        print("No Caddyfile changes needed.")
        return

    backup = CADDYFILE.with_name("Caddyfile.before-csp-report-only")
    backup.write_text(original)
    CADDYFILE.write_text(updated)
    print(f"Updated {CADDYFILE}; backup written to {backup}")


if __name__ == "__main__":
    main()
