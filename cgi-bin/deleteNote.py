import json
from db import dbms

def process( request, response ):
	parameters = {}	
	parameters[ 'noteId' ] = request[ 'noteId' ]

	dbms.execute( dbms.DELETE_NOTE, parameters )

	result = { 'code' : 0, 'message' : 'success' }
	response.write( json.dumps( result ) )