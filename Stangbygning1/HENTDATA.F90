LOGICAL(4) FUNCTION HENTDATA( dlg , control_name , callbacktype )
USE DFLOGM
USE STANGMOD
IMPLICIT INTEGER(4) (I-N)
IMPLICIT REAL(8) (A-H,O-Z)
TYPE (dialog) dlg
INTEGER control_name
INTEGER callbacktype
INCLUDE 'resource.fd'
LOGICAL retdlg, retlog
CHARACTER(256) text
INTEGER local_callbacktype
local_callbacktype = callbacktype
HENTDATA = .TRUE.
IFASE = 2
END FUNCTION HENTDATA
