import json
from engine import ai

def process( request, response ):
	contents = request[ 'title' ] + request[ 'contents' ]

	notes = dbms.execute( dbms.SELECT_NOTES )

	classifier = naivebayes( getwords )

	for i in range( len( notes ) ):
		classifier.train( notes[ i ].title + notes[ i ].contents, notes[ i ].categoryId )
		
	categoryId = classifier.classify( contents, default=-1 )

	if categoryId == -1:
		result = { 'code' : -1, 'message' : 'No applicable category' }
	else:
		categoryName = dbms.execute( dbms.SELECT_CATEGORIE_ON_ID, { 'categoryId' : categoryId } )[ 0 ].name
		result = { 'code' : 0, 'message' : 'success', 'categoryId' : categoryId, 'categoryName' : categoryName }

	response.write( json.dumps( result ) )

def getwords( contents ):
	splitter = re.compile( '[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9]+' )
	words = [ s.lower() for s in splitter.split( contents ) if len( s ) != 0 ]
	return dict( [ ( w, 1 ) for w in words ] )