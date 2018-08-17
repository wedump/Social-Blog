import json
from app import App

app = App()

@app.route( 'notes' )
def gets( request, response ):
    result = { 'code' : 0, 'message' : 'success' }
    response.write( json.dumps( result ) )

@app.route( 'notes/${id}' )
def get( request, response ):
    result = { 'code' : 0, 'message' : 'success' }
    response.write( json.dumps( result ) )

@app.route( 'notes' )
def post( request, response ):
    result = { 'code' : 0, 'message' : 'success' }
    response.write( json.dumps( result ) )

@app.route( 'notes/${id}' )
def put( request, response ):
    result = { 'code' : 0, 'message' : 'success' }
    response.write( json.dumps( result ) )

@app.route( 'notes/${id}' )
def delete( request, response ):
    result = { 'code' : 0, 'message' : 'success' }
    response.write( json.dumps( result ) )
