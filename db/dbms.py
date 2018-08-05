import sqlite3, sys

def dict_factory( cursor, row ):
	result = {}
	
	for index, column in enumerate( cursor.description ):
		result[ column[ 0 ] ] = row[ index ]
	
	return result

def execute( query, parameters = None ):
	connection = sqlite3.connect( 'db/database.sqlite' )
	connection.row_factory = dict_factory
	cursor = connection.cursor()

	if parameters is not None:
		for key in parameters.keys():
			value = parameters[ key ]

			if type( value ) == str:
				value = "'" + value + "'"

			query = query.replace( '${' + str( key ) + '}', str( value ) )

	cursor.execute( query )	
	result = cursor.fetchall()
	
	connection.commit()
	connection.close()

	return result

CREATE_TABLE_CATEGORY = """
	CREATE TABLE category (
		id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL,
		name TEXT NOT NULL
	)
"""

CREATE_TABLE_NOTE = """
	CREATE TABLE note (
		id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE NOT NULL,
		title TEXT,
		contents TEXT,
		categoryId INTEGER
	)
"""

SELECT_CATEGORIES = """
	SELECT c.id, c.name, ( SELECT COUNT(*) FROM note WHERE categoryId = c.id ) AS noteCount FROM category c
"""

SELECT_CATEGORIE_ON_ID = """
	SELECT * FROM category WHERE id = ${categoryId}
"""

SELECT_NOTES = """
	SELECT * FROM note
"""

SELECT_NOTES_ON_CATEOGRY = """
	SELECT * FROM note WHERE categoryId = ${categoryId}
"""

INSERT_CATEGORY = """
	INSERT INTO category ( name ) VALUES ( ${name} )	
"""

INSERT_NOTE = """
	INSERT INTO note ( title, categoryId ) VALUES ( ${title}, ${categoryId} )
"""

UPDATE_NOTE = """
	UPDATE note SET title = ${title}, contents = ${contents} WHERE id = ${noteId}
"""

DELETE_CATEGORY = """
	DELETE FROM category WHERE id = ${categoryId}
"""

DELETE_NOTE = """
	DELETE FROM note WHERE id = ${noteId}
"""

DELETE_NOTES_ON_CATEGORY = """
	DELETE FROM note WHERE categoryId = ${categoryId}
"""