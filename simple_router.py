import os, time, sys
from io import StringIO
from importlib import import_module
from app import App

sys.path.append( './' )

app = App()
default_page = 'index.html'
encoding = 'utf-8'
weekdayname = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ]
monthname = [ None, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
extensions_map = {
	"html" : "text/html",
	"htm" : "text/html",
	"ico" : "image/x-icon",
	"js" : "text/javascript",
	"css" : "text/css",
	"jpg" : "image/jpeg",
	"png" : "image/png",
	"gif" : "image/gif",
	"mp4" : "video/mp4",
	"avi" : "video/avi"
}

class Response:
	def __init__( self, stdout ):
		self.stdout = stdout

	def write( self, contents ):
		print( contents, file = self.stdout )

def route( environ, start_response ):
	stdout = StringIO()
	path = environ.get( 'PATH_INFO' )[ 1: ] or default_page
	extension = path[ path.rfind( '.' ) + 1: ]

	if extension in extensions_map.keys():
		return do_static( path, extension, start_response )

	return do_dynamic( path, environ, start_response, stdout )

def do_static( path, extension, start_response ):
	try:
		f = open( path, 'rb' )
	except OSError:
		start_response( '404 File not found', [] )
		return []

	try:
		fs = os.fstat( f.fileno() )
		start_response( '200 OK', [ ( 'Content-Type', get_ctype( extension ) ), ( 'Content-Length', str( fs[ 6 ]) ), ( 'Last-Modified', date_time_string( fs.st_mtime ) ) ] )
		return f.readlines()
	except:
		f.close()
		raise

def do_dynamic( path, environ, start_response, stdout ):
	method = environ.get( 'REQUEST_METHOD' )
	request = environ.get( 'REQUEST_PAYLOAD' )
	module = get_routing_module(app.router, path, method, request)
	
	if module:
		module( request, Response( stdout ) )
		start_response( '200 OK', [ ( 'Content-Type', 'text/json; charset' + encoding ) ] )
	else:
		start_response( '404 Not Found', [ ( 'Content-Type', 'text/json; charset' + encoding ) ] )

	return [ stdout.getvalue().encode( encoding ) ]

def get_routing_module( router, path, method, request ):
	path_separator = '/'
	param_flag_start = '${'
	param_flag_end = '}'

	request_paths = path.split( path_separator )
	path_len = len( request_paths )

	for k in router:
		(p, m) = k
		router_paths = p.split( path_separator )
		if len( router_paths ) != path_len: continue
		
		matched = True
		for i in range( path_len ):
			rop, rep = router_paths[ i ], request_paths[ i ]
			
			if rop.startswith( param_flag_start ):
				key = rop.replace( param_flag_start, '' ).replace( param_flag_end, '' )
				request[ key ] = rep
				continue
			if rop != rep:
				matched = False
				break

		if matched and m == method:
			return router[ k ]

def get_ctype( extension ):
	return extensions_map.get( extension, '' )

def date_time_string( self, timestamp=None ):	
	if timestamp is None:
		timestamp = time.time()

	year, month, day, hh, mm, ss, wd, y, z = time.gmtime( timestamp )

	s = "%s, %02d %3s %4d %02d:%02d:%02d GMT" % (
		weekdayname[ wd ],
		day, monthname[ month ], year,
		hh, mm, ss)

	return s