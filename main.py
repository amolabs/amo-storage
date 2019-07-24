from amo_storage import create_app
from argparse import ArgumentParser

if __name__ == '__main__':

    parser = ArgumentParser()
    parser.add_argument('--config_path', help="path to config ini file")
    parser.add_argument('--host', default="127.0.0.1", help="host to run")
    parser.add_argument('--port', default=5000, help="running port")

    args = parser.parse_args()
    cfg_path = args.config_path
    host = args.host
    port = args.port

    if cfg_path is not None:
        app = create_app(CONFIG_PATH=cfg_path)
    else:
        app = create_app()

    app.run(host, port)
