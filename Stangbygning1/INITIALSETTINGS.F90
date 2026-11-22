LOGICAL(4) FUNCTION INITIALSETTINGS( )
USE DFLIB
EXTERNAL HENTFIL, LASTDIALOG
LOGICAL(4) checked , logres
TYPE (qwinfo) qwi
! Set window frame size.
qwi.x = 0
qwi.y = 0
qwi.w = 768
qwi.h = 1024
qwi.type = QWIN$SET
i = SetWSizeQQ( QWIN$FRAMEWINDOW, qwi )
! Create first menu NyFil.
logres = APPENDMENUQQ(1, $MENUENABLED, '&NyFil'C, HENTFIL )
! Draw a separator bar.
logres = APPENDMENUQQ(1, $MENUSEPARATOR, ''C, NUL )
! Add item called Forfra.
logres = APPENDMENUQQ(1, $MENUENABLED, '&Forfra'C, NUL )
! Add item called Nylast.
logres = APPENDMENUQQ(1, $MENUENABLED, '&NyLast'C, LASTDIALOG)
! Add item PRINT
logres = APPENDMENUQQ(1, $MENUENABLED, '&PRINT'C, WINPRINT)
! Add item called Exit.
logres = APPENDMENUQQ(1, $MENUENABLED, 'E&xit'C, WINEXIT )
INITIALSETTINGS= .true.
END FUNCTION INITIALSETTINGS
