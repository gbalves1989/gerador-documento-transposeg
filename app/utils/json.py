import os
import json
from flask import current_app


class JsonUtils:
    @staticmethod
    def default_data():
        return {
            "tabs": ["Documento 1", "Documento 2", "Documento 3"],
            "data": {
                "Documento 1": {},
                "Documento 2": {},
                "Documento 3": {}
            }
        }

    @staticmethod
    def load_json():
        if not os.path.exists(current_app.config["JSON_FILE"]):
            data = JsonUtils.default_data()
            JsonUtils.save_json(data)
            return data

        with open(current_app.config["JSON_FILE"], "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = JsonUtils.default_data()
                JsonUtils.save_json(data)
                return data

        if "tabs" not in data or "data" not in data:
            data = JsonUtils.default_data()
            JsonUtils.save_json(data)
            return data

        for tab in data["tabs"]:
            if tab not in data["data"]:
                data["data"][tab] = {}

        extra_keys = list(data["data"].keys())
        for key in extra_keys:
            if key not in data["tabs"]:
                del data["data"][key]

        return data

    @staticmethod
    def save_json(data):
        with open(current_app.config["JSON_FILE"], "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            