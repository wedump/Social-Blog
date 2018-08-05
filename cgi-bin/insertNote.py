import json
from db import dbms

def process( request, response ):
	parameters = {}
	parameters[ 'title' ] = request[ 'title' ]
	parameters[ 'categoryId' ] = request[ 'categoryId' ]

	dbms.execute( dbms.INSERT_NOTE, parameters )

	result = { 'code' : 0, 'message' : 'success' }
	response.write( json.dumps( result ) )