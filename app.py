#!/usr/bin/python3

def singleton(clazz):
  instances = {}
  def getInstance(*args, **kwargs):
    if clazz not in instances:
        instances[clazz] = clazz(*args, **kwargs)
    return instances[clazz]
  return getInstance

def throughDecorator(router, path):
    def decorator(origin):		
        router[path] = origin
        def wrapper(*args, **kwargs):
            return origin(*args, **kwargs)
        return wrapper
    return decorator

@singleton
class App:
    def __init__(self):
        self.router = {}
    def route(self, path):
        return throughDecorator(self.router, path)
