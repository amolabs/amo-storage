schema = {
    "type": "object",
    "properties": {
        "owner": {
            "type": "string",
            "pattern": "^[a-f0-9]{40}$"
        },
        "metadata": {
            "type": "object",
            "required": ["owner"]
        },
        "data": {
            "type": "string",
            "pattern": "^[a-f0-9]+$"
        }
    },
    "required": ["owner", "metadata", "data"]
}