import json
from db import dbms

def process( request, response ):
	parameters = { 'categoryId' : request[ 'categoryId' ] }
	
	result = dbms.execute( dbms.SELECT_NOTES_ON_CATEOGRY, parameters )
	
	response.write( json.dumps( result ) )