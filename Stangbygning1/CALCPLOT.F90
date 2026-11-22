SUBROUTINE CALCPLOT
USE DFLIB
USE STANGMOD
IMPLICIT INTEGER(4) (I-N) , REAL(8) (A-H,O-Z)
CHARACTER*(7)       FMT
CHARACTER*(44)      str
CHARACTER(256)		  text
LOGICAL             statusmode
TYPE (windowconfig) myscreen
TYPE (wxycoord)     wxy
TYPE (wxycoord)     poly(4)
TYPE (rccoord)      curpos
COMMON              myscreen
!
!  BEREGNING AF VIRKELIG UDBØJNING
!
CALL BEAM
!  TABEL UDSKRIVES FOR HELE STANGEN
WRITE(7,*)
WRITE(7,23456) NYVISH,NYTRIS 
23456 FORMAT(' VIRKELIG UDBØJNINGSKURVE FOR SNØREVINKEL=',F6.2,' GRADER',/&
             ' OG TRÆK I SNØREN=',F8.4)
BMIN = 1.0D20
BMAX = -1.0D20
SIGMAX = 0.0_8
XIGM = HAND
DO I = NHAND,NEL
	Z = XL(I)
	R = RR(I)
	BM = XD(3,I) 
	BMIN = MIN(BM,BMAX)
	BMAX = MAX(BM,BMAX)
	SIGMA = ABS(XD(4,I)) 
	IF ( SIGMA .GT. SIGMAX ) THEN
		SIGMAX = SIGMA
		XIGM = XL(I)
	ENDIF
   WRITE(7,55555) I,Z,STAL-Z,XD(1,I),XD(2,I),XD(0,I)*GRAD,&
						XD(3,I),XD(4,I),RR(I)*DIAM
ENDDO
55555 FORMAT(I3,' X=',F6.1,',',F6.1,' Ux=',F6.1,' Uy=',F6.1,' Vinkel=',F6.2,&
' Bøjmoment=',F8.1,' Spænding=',F8.2,' Diameter=',F7.3)
WRITE(7,66666) XIGM,SIGMAX,STAL-XIGM
66666 FORMAT(/' Afstand fra håndtagsenden',F7.1,' SIGMAX=',F9.1,&
' fra spidsenden',F7.1/)
! PLOT AF UDBØJET STANG FORBEREDES
IF ( AABEN ) THEN
	IRES = FOCUSQQ(8)
ELSE
	myscreen.title = "Udbøjning"C
	OPEN(UNIT = 8, FILE = 'USER', TITLE = 'UDBØJNING')
	statusmode = SETWINDOWCONFIG(myscreen)
   IF(.NOT. statusmode) statusmode = SETWINDOWCONFIG(myscreen)
   statusmode = GETWINDOWCONFIG( myscreen )
   bkcolor = SETBKCOLORRGB( #FFFFFF )   ! FULL WHITE
	myscreen.title = "Tykkelse"C
ENDIF
CALL CLEARSCREEN( $GCLEARSCREEN )
xwidth  = myscreen.numxpixels
yheight = myscreen.numypixels
XMAX = STAL
YMAX = XD(1,0)
F = 0.65_8*XMAX
IF ( F .GT. YMAX ) THEN
!  PLOTSTØRRELSEN BESTEMT AF X-AKSEN STAL
	YMAX = F
ELSE
!  PLOTSTØRRELSEN BESTEMT AF Y-AKSEN XD(1,0)
	XMAX = YMAX/0.65_8 
ENDIF
! RAND AF WINDOW, VENSTRE, HØJRE, UNDERST, OEVERST  
VRAN = -0.1_8*XMAX
HRAN = 1.1_8*XMAX
ORAN = -0.22_8*XMAX
URAN = 0.73_8*XMAX
XDEL= 0.01_8*XMAX
XSCRAT = (HRAN-VRAN)/XWIDTH
YSCRAT = (URAN-ORAN)/YHEIGHT
status = SETWINDOW(.TRUE., VRAN, ORAN, HRAN*1.01_8, URAN*1.01_8)
  oldcolor = SETCOLORRGB( #FF0000 )  ! full blue
  ORAN = -0.1_8*XMAX
  status = RECTANGLE_W( $GBORDER,VRAN+XDEL,ORAN+XDEL,HRAN-XDEL,URAN-XDEL)
XMIN = 0.0_8
YMIN = 0.0_8
CALL GRIDSHAPE(XMIN,YMIN,XMAX,YMAX,10)
fontnum = SETFONT ('t''Arial''h18w12i')
WRITE(STR,*) 'UDBØJNING AF SPLITCANE FISKESTANG'
pwidth= GETGTEXTEXTENT(STR)
T = XSCRAT*pwidth
H = 18*XSCRAT
CALL MOVETO_W( (XMIN+XMAX-T)/2,YMAX*1.08_8, wxy )
CALL OUTGTEXT(STR)!
!
!    TEGN STANGEN
!
V1 = XD(0,0)
X1 = XD(1,0)
Y1 = XD(2,0)
R = RR(0)
DO I = 1,NEL
	I1 = I-1
	IF (RMIN .GT. 0.001 ) THEN
		oldcolor = SETCOLORRGB( #000000 )   ! BLACK
 		CALL MOVETO_W(XI(1,I1),XI(2,I1), wxy )
		status = LINETO_W( XI(1,I),XI(2,I) )
	ENDIF
	TX1 = -R*SIN(V1)
	TY1 = R*COS(V1)
	R = RR(I)
	V2 = XD(0,I)
	X2 = XD(1,I)
	Y2 = XD(2,I)
	TX2 = -R*SIN(V2)
	TY2 = R*COS(V2)
	IF ( I .EQ. LFERL ) THEN
		oldcolor = SETCOLORRGB( #00AA00 )   ! DARK GREEN
		TX1 = TX1*1.2
		TY1 = TY1*1.2
		TX2 = TX2*1.2
		TY2 = TY2*1.2
	ELSEIF ( I .LE. NHAND ) THEN
		oldcolor = SETCOLORRGB( #0000DD )   ! DARK RED
		TX1 = TX1*2.0
		TY1 = TY1*2.0
		TX2 = TX2*2.0
		TY2 = TY2*2.0
	ELSE
		oldcolor = SETCOLORRGB( #30CCCC )   ! DARK YELLOW
	ENDIF
	POLY(1).WX = X1+TX1
	POLY(1).WY = Y1+TY1
	POLY(2).WX = X1-TX1
	POLY(2).WY = Y1-TY1
	POLY(3).WX = X2-TX2
	POLY(3).WY = Y2-TY2
	POLY(4).WX = X2+TX2
	POLY(4).WY = Y2+TY2
	status = POLYGON_W($GFILLINTERIOR, poly, INT2(4))
	oldcolor = SETCOLORRGB( #000000 )   ! black
	status = POLYGON_W($GBORDER, poly, INT2(4))
	V1 = V2
	X1 = X2
	Y1 = Y2
END DO
!
!    TEGN RADIER TIL CENTRUM
!
style = #EEEE
CALL SETLINESTYLE(style)
oldcolor = SETCOLORRGB( #FF0000 )   ! 
CALL MOVETO_W( XD(1,NHAND), XD(2,NHAND), wxy )
status = LINETO_W( XCENTR, YCENTR )
status = LINETO_W( XI(1,NEL), XI(2,NEL) )
!
!    TEGN SNØREN
!
style = #DDDD
CALL SETLINESTYLE(style)
oldcolor = SETCOLORRGB( #0000FF )   ! RED
TANT = (HEY2-HEY1)/(STAL-HAND-AFST)
CALL MOVETO_W( 0.0_8, XYG(1,2)*TANT+XYG(2,2), wxy )
DO I = 2,N1
   status = LINETO_W( XYG(1,I), XYG(2,I) )
END DO
WRITE(7,*) ' CALCPLOT:VISH=',RISH*GRAD
CX = XYG(1,N1)+(YMAX-XYG(2,N1))*COTAN(RISH)
IF ( CX > XMAX ) THEN
	CX = XMAX
	CY = XYG(2,N1)+TAN(RISH)*(XMAX-XYG(1,N1))
ELSEIF ( CX < XMIN ) THEN
	CX = XMIN
	CY = XYG(2,N1)+TAN(RISH)*(XMIN-XYG(1,N1))
ELSE
	CY = YMAX
ENDIF
status = LINETO_W( CX, CY )
!
!     PLOT ØJERNES POSITION
!
oldcolor = SETCOLORRGB( #0000FF )   ! RED
style = #FFFF
CALL SETLINESTYLE(style)
H = 0.001_8*STAL
oldcolor = SETCOLORRGB( #900090 )   ! DARK MAGENTA
L = NHAND
DO I = 2,N1
	I1 = I-1
	Z = ZEYE(I)
	DO WHILE( ABS(XL(L)-Z) .GT. 2.0D-9 )
		L = L+1
	ENDDO 
	V = XD(0,L)
	TX = H*COS(V)
	TY = H*SIN(V)
	X = XYG(1,I)
	Y = XYG(2,I)
	POLY(1).WX = X+TX
	POLY(1).WY = Y+TY
	POLY(2).WX = X-TX
	POLY(2).WY = Y-TY
	X = XD(1,L)
	Y = XD(2,L)
	POLY(3).WX = X-TX
	POLY(3).WY = Y-TY
	POLY(4).WX = X+TX
	POLY(4).WY = Y+TY
	status = POLYGON_W($GFILLINTERIOR, poly, INT2(4))
END DO
!  status = SAVEIMAGE_W(FILGR1,VRAN+XDEL,URAN-XDEL,HRAN-XDEL,ORAN+XDEL)
! IF (STATUS .LT. 0 ) WRITE(7,*) FILGR1,' IKKE SKREVET',STATUS
!
IF ( IFASE .LE. 2 ) THEN
!
!     PLOT TYKKELSE
!
	IF ( AABEN ) THEN
		IRES = FOCUSQQ(9)
	ELSE
		myscreen.title = "Tykkelse"C
		OPEN(UNIT = 9, FILE = 'USER', TITLE = 'Tykkelse')
		statusmode = SETWINDOWCONFIG(myscreen)
		IF(.NOT. statusmode) statusmode = SETWINDOWCONFIG(myscreen)
		statusmode = GETWINDOWCONFIG( myscreen )
		myscreen.title = "Bøjningsmoment"C
		bkcolor = SETBKCOLORRGB( #FFFFFF )   ! full white
	ENDIF
	CALL CLEARSCREEN( $GCLEARSCREEN )
	xwidth  = myscreen.numxpixels
	yheight = myscreen.numypixels
	numfonts = INITIALIZEFONTS ( )
!	RAND AF WINDOW, VENSTRE, HØJRE, UNDERST, OEVERST 
	YMAX = DIAM*RR(0) 
	VRAN = -0.1_8*XMAX
	HRAN = 1.1_8*XMAX
	URAN = -0.27_8*YMAX
	ORAN = 1.1_8*YMAX
	XSCRAT = (HRAN-VRAN)/XWIDTH
	YSCRAT = (URAN-ORAN)/YHEIGHT
	YDEL = 0.01_8*(YMAX-YMIN)
	status = SETWINDOW(.TRUE., VRAN, ORAN, HRAN*1.01_8, URAN*1.01_8)
	URAN = -0.1_8*YMAX
	oldcolor = SETCOLORRGB( #FF0000 )  ! full blue
	style = #FFFF
	CALL SETLINESTYLE(style)
	status = RECTANGLE_W( $GBORDER,VRAN+XDEL,ORAN-YDEL,HRAN-XDEL,URAN+YDEL)
	CALL GRIDSHAPE(0.0_8,0.0_8,XMAX,YMAX,10)
	fontnum = SETFONT ('t''Arial''h18w12i')
	WRITE(STR,*) 'DIAMETER OG HØJDE AF SPLIT FRA CENTRUM'
	pwidth= GETGTEXTEXTENT(STR)
	XSCRAT = 1.2_8*(XMAX-XMIN)/XWIDTH
	YSCRAT = 0.8_8*(YMAX-YMIN)/YHEIGHT
	T = XSCRAT*pwidth
	H = 32*YSCRAT
	CALL MOVETO_W( (XMIN+XMAX-T)/2,YMAX*1.08, wxy )
	CALL OUTGTEXT(STR)!
	!  Plot the points.
	!
	oldcolor = SETCOLORRGB( #000000 )   ! BLACK
	style = #FFFF
	CALL SETLINESTYLE(style)
	H = DIAM
	DO IDH = 1,2
		CALL MOVETO_W( XL(0), H*RR(0), wxy )
		DO I = 1,NEL
			status = LINETO_W( XL(I), H*RR(I) )
		END DO
		H = HIGH
	END DO
	oldcolor = SETCOLORRGB( #900090 )   ! DARK MAGENTA
	fontnum = SETFONT ('t''Arial''h12w8i')
	A = MAX(ABS(XMIN),ABS(XMAX))
	I = INT(LOG10(A))
	LA = MAX(0,4-I)
	LA = MIN(3,LA)
	WRITE(FMT,10111) LA
	10111		FORMAT('(F6.',I1,')')
	T = XSCRAT*24
	H = YSCRAT*18
	DO I = 2,N1
		X = ZEYE(I)
		WRITE(STR,FMT) X
 		CALL MOVETO_W(X-T,YMAX+H, wxy )
		CALL OUTGTEXT(STR)
 		CALL MOVETO_W(X,YMAX, wxy )
		status = LINETO_W( X, XMIN )
	ENDDO
ENDIF
IF ( AABEN ) THEN
	IRES = FOCUSQQ(10)
ELSE
!
!     PLOT BØJNINGSMOMENT
!
	myscreen.title = "Bøjningsmoment"C
	OPEN(UNIT = 10, FILE = 'USER', TITLE = 'Bøjningsmoment')
	statusmode = SETWINDOWCONFIG(myscreen)
   IF(.NOT. statusmode) statusmode = SETWINDOWCONFIG(myscreen)
   statusmode = GETWINDOWCONFIG( myscreen )
   bkcolor = SETBKCOLORRGB( #FFFFFF )   ! full white
ENDIF
CALL CLEARSCREEN( $GCLEARSCREEN )
xwidth  = myscreen.numxpixels
yheight = myscreen.numypixels
numfonts = INITIALIZEFONTS ( )
! RAND AF WINDOW, VENSTRE, HØJRE, UNDERST, OEVERST 
YMAX = BMAX 
VRAN = -0.1_8*XMAX
HRAN = 1.1_8*XMAX
URAN = -0.27_8*YMAX
ORAN = 1.1_8*YMAX
XSCRAT = (HRAN-VRAN)/XWIDTH
YSCRAT = (URAN-ORAN)/YHEIGHT
YDEL = 0.01_8*(YMAX-YMIN)
status = SETWINDOW(.TRUE., VRAN, ORAN, HRAN*1.01_8, URAN*1.01_8)
URAN = -0.1_8*YMAX
oldcolor = SETCOLORRGB( #FF0000 )  ! full blue
style = #FFFF
CALL SETLINESTYLE(style)
status = RECTANGLE_W( $GBORDER,VRAN+XDEL,ORAN-YDEL,HRAN-XDEL,URAN+YDEL)
CALL GRIDSHAPE(0.0_8,0.0_8,XMAX,YMAX,10)
fontnum = SETFONT ('t''Arial''h18w12i')
WRITE(STR,*) 'BØJNINGSMOMENT I SPLITCANE FISKESTANG'
pwidth= GETGTEXTEXTENT(STR)
XSCRAT = 1.2_8*(XMAX-XMIN)/XWIDTH
YSCRAT = 0.8_8*(YMAX-YMIN)/YHEIGHT
T = XSCRAT*pwidth
H = 32*YSCRAT
CALL MOVETO_W( (XMIN+XMAX-T)/2,YMAX*1.08, wxy )
CALL OUTGTEXT(STR)!
!     Plot the points.
!
oldcolor = SETCOLORRGB( #000000 )   ! BLACK
style = #FFFF
CALL SETLINESTYLE(style)
CALL MOVETO_W( XL(NHAND), YMIN, wxy )
status = LINETO_W( XL(NHAND), XD(3,NHAND) )
DO I = NHAND,NEL
	status = LINETO_W( XL(I), XD(3,I) )
END DO
oldcolor = SETCOLORRGB( #900090 )   ! DARK MAGENTA
fontnum = SETFONT ('t''Arial''h12w8i')
A = MAX(ABS(XMIN),ABS(XMAX))
I = INT(LOG10(A))
LA = MAX(0,4-I)
LA = MIN(3,LA)
WRITE(FMT,10111) LA
T = XSCRAT*24
H = YSCRAT*18
DO I = 2,N1
	X = ZEYE(I)
	WRITE(STR,FMT) X
 	CALL MOVETO_W(X-T,YMAX+H, wxy )
	CALL OUTGTEXT(STR)
 	CALL MOVETO_W(X,YMAX, wxy )
   status = LINETO_W( X, XMIN )
ENDDO
! status = SAVEIMAGE_W(FILGR2,VRAN+XDEL,URAN+YDEL,HRAN-XDEL,ORAN-YDEL)
! IF (STATUS .LT. 0 ) WRITE(7,*) FILGR2,' IKKE SKREVET',STATUS
IF ( AABEN ) THEN
	IRES = FOCUSQQ(11)
ELSE
!
!     PLOT BØJNINGSSPÆNDING
!
	myscreen.title = "Spænding"C
	OPEN(UNIT = 11, FILE = 'USER', TITLE = 'Spænding')
	statusmode = SETWINDOWCONFIG(myscreen)
   IF(.NOT. statusmode) statusmode = SETWINDOWCONFIG(myscreen)
   statusmode = GETWINDOWCONFIG( myscreen )
   bkcolor = SETBKCOLORRGB( #FFFFFF )   ! full white
ENDIF
CALL CLEARSCREEN( $GCLEARSCREEN )
xwidth  = myscreen.numxpixels
yheight = myscreen.numypixels
numfonts = INITIALIZEFONTS ( )
! RAND AF WINDOW, VENSTRE, HØJRE, UNDERST, OEVERST 
YMAX = SIGMAX 
VRAN = -0.1_8*XMAX
HRAN = 1.1_8*XMAX
URAN = -0.27_8*YMAX
ORAN = 1.1_8*YMAX
XSCRAT = (HRAN-VRAN)/XWIDTH
YSCRAT = (URAN-ORAN)/YHEIGHT
YDEL = 0.01_8*(YMAX-YMIN)
status = SETWINDOW(.TRUE., VRAN, ORAN, HRAN*1.01_8, URAN*1.01_8)
URAN = -0.1_8*YMAX
oldcolor = SETCOLORRGB( #FF0000 )  ! full blue
style = #FFFF
CALL SETLINESTYLE(style)
status = RECTANGLE_W( $GBORDER,VRAN+XDEL,ORAN-YDEL,HRAN-XDEL,URAN+YDEL)
CALL GRIDSHAPE(0.0_8,0.0_8,XMAX,YMAX,10)
fontnum = SETFONT ('t''Arial''h18w12i')
WRITE(STR,*) 'BØJNINGSSPÆNDING I SPLITCANE FISKESTANG'
pwidth= GETGTEXTEXTENT(STR)
XSCRAT = 1.2_8*(XMAX-XMIN)/XWIDTH
YSCRAT = 0.8_8*(YMAX-YMIN)/YHEIGHT
T = XSCRAT*pwidth
H = 32*YSCRAT
CALL MOVETO_W( (XMIN+XMAX-T)/2,YMAX*1.08, wxy )
CALL OUTGTEXT(STR)!
!     Plot the points.
!
oldcolor = SETCOLORRGB( #000000 )   ! BLACK
style = #FFFF
CALL SETLINESTYLE(style)
CALL MOVETO_W( XL(NHAND), YMIN, wxy )
status = LINETO_W( XL(NHAND), XD(4,NHAND) )
DO I = NHAND,NEL
	status = LINETO_W( XL(I), XD(4,I) )
END DO
oldcolor = SETCOLORRGB( #900090 )   ! DARK MAGENTA
fontnum = SETFONT ('t''Arial''h12w8i')
A = MAX(ABS(XMIN),ABS(XMAX))
I = INT(LOG10(A))
LA = MAX(0,4-I)
LA = MIN(3,LA)
WRITE(FMT,10111) LA
T = XSCRAT*24
H = YSCRAT*18
DO I = 2,N1
	X = ZEYE(I)
	WRITE(STR,FMT) X
 	CALL MOVETO_W(X-T,YMAX+H, wxy )
	CALL OUTGTEXT(STR)
 	CALL MOVETO_W(X,YMAX, wxy )
   status = LINETO_W( X, XMIN )
ENDDO
AABEN = .TRUE.
! status = SAVEIMAGE_W(FILGR2,VRAN+XDEL,URAN+YDEL,HRAN-XDEL,ORAN-YDEL)
! IF (STATUS .LT. 0 ) WRITE(7,*) FILGR2,' IKKE SKREVET',STATUS
END
