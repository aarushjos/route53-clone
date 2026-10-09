import re
from ipaddress import IPv4Address, IPv6Address

LABEL = re.compile(r"^[A-Za-z0-9_]([A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?$")
CAA_TAGS = {"issue", "issuewild", "iodef"}


def is_domain(value: str, allow_wildcard: bool = False) -> bool:
    v = value.strip().rstrip(".")
    if not v or len(v) > 253:
        return False
    for i, label in enumerate(v.split(".")):
        if allow_wildcard and i == 0 and label == "*":
            continue
        if not LABEL.match(label):
            return False
    return True


def check_a(v):
    try:
        IPv4Address(v)
    except ValueError:
        raise ValueError(f"'{v}' is not a valid IPv4 address")


def check_aaaa(v):
    try:
        IPv6Address(v)
    except ValueError:
        raise ValueError(f"'{v}' is not a valid IPv6 address")


def check_domain(v):
    if not is_domain(v):
        raise ValueError(f"'{v}' is not a valid domain name")


def check_txt(v):
    if len(v) > 4000:
        raise ValueError("TXT value is too long")


def check_mx(v):
    parts = v.split()
    if len(parts) != 2 or not parts[0].isdigit() or int(parts[0]) > 65535:
        raise ValueError("MX must look like: 10 mail.example.com")
    check_domain(parts[1])


def check_srv(v):
    parts = v.split()
    if len(parts) != 4 or not all(p.isdigit() for p in parts[:3]):
        raise ValueError("SRV must look like: 10 5 443 server.example.com")
    if any(int(p) > 65535 for p in parts[:3]):
        raise ValueError("SRV priority, weight and port must be 0-65535")
    check_domain(parts[3])


def check_caa(v):
    parts = v.split(None, 2)
    if len(parts) != 3 or not parts[0].isdigit() or int(parts[0]) > 255:
        raise ValueError('CAA must look like: 0 issue "letsencrypt.org"')
    if parts[1] not in CAA_TAGS:
        raise ValueError("CAA tag must be issue, issuewild or iodef")
    if not (parts[2].startswith('"') and parts[2].endswith('"') and len(parts[2]) >= 2):
        raise ValueError("CAA value must be wrapped in double quotes")


CHECKS = {
    "A": check_a,
    "AAAA": check_aaaa,
    "CNAME": check_domain,
    "TXT": check_txt,
    "MX": check_mx,
    "NS": check_domain,
    "PTR": check_domain,
    "SRV": check_srv,
    "CAA": check_caa,
}


def validate_values(rtype: str, values: list[str]) -> None:
    if not values:
        raise ValueError("At least one value is required")
    if rtype == "CNAME" and len(values) != 1:
        raise ValueError("A CNAME record takes exactly one value")
    for v in values:
        v = v.strip()
        if not v:
            raise ValueError("Values cannot be empty")
        if rtype in CHECKS:
            CHECKS[rtype](v)