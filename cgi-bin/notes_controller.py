import json
from app import App, HttpMethod

app = App()

@app.route( 'notes', methods = [ HttpMethod.GET ] )
def getAll( request, response ):
    result = { 'code' : 0, 'message' : 'success - getAll' }
    response.write( json.dumps( result ) )

@app.route( 'notes/${id}', methods = [ HttpMethod.GET ] )
def get( request, response ):
    result = { 'code' : 0, 'message' : 'success - get %s' % request['id'] }
    response.write( json.dumps( result ) )

@app.route( 'notes', methods = [ HttpMethod.POST ] )
def add( request, response ):
    result = { 'code' : 0, 'message' : 'success - add %s' % request['title'] }
    response.write( json.dumps( result ) )

@app.route( 'notes/${id}', methods = [ HttpMethod.PUT ] )
def edit( request, response ):
    result = { 'code' : 0, 'message' : 'success - edit %s %s' % (request['id'], request['title']) }
    response.write( json.dumps( result ) )

@app.route( 'notes/${id}', methods = [ HttpMethod.DELETE ] )
def remove( request, response ):
    result = { 'code' : 0, 'message' : 'success - remove %s' % request['id'] }
    response.write( json.dumps( result ) )
