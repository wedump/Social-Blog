import json
from db import dbms

def process( request, response ):
	parameters = {}
	parameters[ 'name' ] = request[ 'name' ]	

	dbms.execute( dbms.INSERT_CATEGORY, parameters )	

	result = { 'code' : 0, 'message' : 'success' }
	response.write( json.dumps( result ) )