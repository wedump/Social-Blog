#!/usr/bin/python3

import json, urllib.parse, simple_router
from wsgiref.simple_server import make_server, WSGIServer, WSGIRequestHandler
from socketserver import ThreadingMixIn

encoding = 'utf-8'
log_file = open( 'log/simple.log', 'a' )

class ThreadedWSGIServer( ThreadingMixIn, WSGIServer ):
	pass

class SimpleRequestHandler( WSGIRequestHandler ):
	def get_environ( self ):
		environ = super( SimpleRequestHandler, self ).get_environ()
		request_payload = {}

		if self.command == 'GET':
			for item in environ.get( 'QUERY_STRING' ).split( '&' ):
				if item: request_payload[ item.split( '=' )[ 0 ] ] = item.split( '=' )[ 1 ]

			if 'parameters' in request_payload:
				request_payload = json.loads( urllib.parse.unquote( request_payload[ 'parameters' ] ) )
		elif self.command == 'POST':
			length = int( self.headers.get( 'content-length' ) )
			
			if length > 0:
				request_payload = json.loads( urllib.parse.unquote( self.rfile.read( length ).decode( encoding ) ) )

		environ[ 'REQUEST_PAYLOAD' ] = request_payload

		return environ

	def log_message( self, format, *args ):
		log_file.write( '%s - - [%s] %s\n' % ( self.address_string(), self.log_date_time_string(), format%args ) )

try:
	httpd = make_server( '', 8000, simple_router.route, ThreadedWSGIServer, SimpleRequestHandler )
	print( 'Starting simple_httpd on port ' + str( httpd.server_port ) )
	httpd.serve_forever()
except KeyboardInterrupt:
	print( 'Shutting down simple_httpd' )
	log_file.close()
	httpd.socket.close()