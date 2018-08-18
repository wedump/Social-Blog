from enum import Enum

def singleton(clazz):
  instances = {}
  def getInstance(*args, **kwargs):
    if clazz not in instances:
        instances[clazz] = clazz(*args, **kwargs)
    return instances[clazz]
  return getInstance

def throughDecorator(router, path, methods):
    def decorator(origin):
        for m in methods: router[(path, m.value)] = origin
        def wrapper(*args, **kwargs):
            return origin(*args, **kwargs)
        return wrapper
    return decorator

@singleton
class App:
    def __init__(self):
        self.router = {}
    def route(self, path, methods):
        return throughDecorator(self.router, path, methods)

class HttpMethod(Enum):
    GET = 'GET'
    POST = 'POST'
    PUT = 'PUT'
    DELETE = 'DELETE'