import json
from db import dbms

def process( request, response ):
	result = dbms.execute( dbms.SELECT_CATEGORIES )
	response.write( json.dumps( result ) )