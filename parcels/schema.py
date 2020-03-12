schema = {
    "type": "object",
    "properties": {
        "owner": {
            "type": "string",
            "pattern": "^[a-fA-F0-9]{40}$"
        },
        "metadata": {
            "type": "object",
            "required": ["owner", "name", "path"]
        },
        "data": {
            "type": "string",
            "pattern": "^[a-fA-F0-9]+$"
        }
    },
    "required": ["owner", "metadata", "data"]
}