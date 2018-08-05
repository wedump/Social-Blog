import json
from db import dbms

def process( request, response ):
	parameters = {}	
	parameters[ 'categoryId' ] = request[ 'categoryId' ]

	dbms.execute( dbms.DELETE_NOTES_ON_CATEGORY, parameters )
	dbms.execute( dbms.DELETE_CATEGORY, parameters )

	result = { 'code' : 0, 'message' : 'success' }
	response.write( json.dumps( result ) )