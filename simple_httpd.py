#!/usr/bin/python3

import os, json, urllib.parse, simple_router
from wsgiref.simple_server import make_server, WSGIServer, WSGIRequestHandler
from socketserver import ThreadingMixIn
from importlib import import_module
from app import HttpMethod

encoding = 'utf-8'
log_file = open( 'log/simple.log', 'a' )

class ThreadedWSGIServer( ThreadingMixIn, WSGIServer ):
	pass

class SimpleRequestHandler( WSGIRequestHandler ):
	def get_environ( self ):
		environ = super( SimpleRequestHandler, self ).get_environ()
		request_payload = {}

		if self.command == HttpMethod.GET.value:
			for item in environ.get( 'QUERY_STRING' ).split( '&' ):
				if item: request_payload[ item.split( '=' )[ 0 ] ] = item.split( '=' )[ 1 ]

			if 'parameters' in request_payload:
				request_payload = json.loads( urllib.parse.unquote( request_payload[ 'parameters' ] ) )
		elif self.command in [ HttpMethod.POST.value, HttpMethod.PUT.value, HttpMethod.DELETE.value ]:
			length = int( self.headers.get( 'content-length' ) )
			
			if length > 0:
				request_payload = json.loads( urllib.parse.unquote( self.rfile.read( length ).decode( encoding ) ) )

		environ[ 'REQUEST_PAYLOAD' ] = request_payload

		return environ

	def log_message( self, format, *args ):
		log_file.write( '%s - - [%s] %s\n' % ( self.address_string(), self.log_date_time_string(), format%args ) )

def init_controller():
	base_package = 'cgi-bin'
	targets = os.listdir(base_package)
	for v in targets:
		import_module(base_package + '.' + v.replace('.py', ''))

try:
	init_controller()
	httpd = make_server( '', 8000, simple_router.route, ThreadedWSGIServer, SimpleRequestHandler )
	print( 'Starting simple_httpd on port ' + str( httpd.server_port ) )
	httpd.serve_forever()
except KeyboardInterrupt:
	print( 'Shutting down simple_httpd' )
	log_file.close()
	httpd.socket.close()