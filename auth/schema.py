schema = {
    "type": "object",
    "properties": {
        "user": {"type": "string"},
        "operation": {"type": "string", "enum": ["upload", "inspect", "download", "remove"]},
    },
    "required": ["user", "operation", ]
}