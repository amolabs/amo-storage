export const schema = {
  "type": "object",
  "properties": {
      "user": {"type": "string"},
      "operation": {
          "type": "object",
          "properties": {
              "name": {"type": "string", "enum": ["upload", "inspect", "download", "remove"]},
              "id": {"type": "string"},
              "hash": {"type": "string", "pattern": "^[a-fA-F0-9]+$"},
          },
          "if": {
              "properties": {"name": {"const": "upload"}},
          },
          "then": {
              "required": ["hash"]
          },
          "else": {
              "required": ["id"]
          },
          "required": ["name"],
          "minProperties": 2
      },
  },
  "required": ["user", "operation", ]
}