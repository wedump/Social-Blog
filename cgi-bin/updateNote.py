import json
from db import dbms

def process( request, response ):
	parameters = {}
	parameters[ 'title' ] = request[ 'title' ]
	parameters[ 'contents' ] = request[ 'contents' ]
	parameters[ 'noteId' ] = request[ 'noteId' ]

	dbms.execute( dbms.UPDATE_NOTE, parameters )

	result = { 'code' : 0, 'message' : 'success' }
	response.write( json.dumps( result ) )