PROGRAM STANG
USE DFLIB
USE DFLOGM
USE STANGMOD
IMPLICIT INTEGER(4) (I-N) , REAL(8) (A-H,O-Z)
!
!   ********************************************************************
!     PROGRAM TIL BEREGNING AF SPLICANE FISKESTÆNGER:
!            VIGGO HOPPE, 20 FEBRUAR 2000
!  ***   1' input linie ************************************************
!     ANTAL KANTER                  : 2 < NKANT 
!     ANTAL ØJER                    : 2 < NEYE < 14
!     ANTAL ELEMENTER I STANGEN ca. : 30 < NELE < NELX (= 120)
!  ***   2' input linie ************************************************
!     ELASTICITETSMODUL             : EMOD  FOR MATERIALET       N/mm**2
!     MASSEFYLDE                    : RHO                        g/cm**3
!     TRÆK I SNØRE                  : NYTRIS                       N
!  ***   3' input linie ************************************************
!     TOTAL STANGLÆNGDE             : STAL                       mm
!     LÆNGDE AF HÅNDTAG,            : HAND                       mm
!     AFSTAND FRA OVERKANT AF HÅNDTAG,
!     TIL NEDERSTE ØJE              : AFST                       mm
!     MINIMUM DIAMETER AF STANG     : SPIDS                      mm
!
!  ***   4' input linie ************************************************
!     FORHOLD MELLEM AFSTANDEN MELLEM DE TO ØVERSTE OG DE TO
!     NEDERSTE ØJER                 : REYE
!		HVIS REYE=0 INDLÆSES ØJEPLACERINGEN
!     HØJDE AF ØVERSTE ØJE          : HEY1                       mm
!     HØJDE AF NEDERSTE ØJE         : HEY2                       mm
!     LÆNGDE AF FERRULE             : FERL                       mm
!     MIN AFST. MLM. ØJE OG FERRULE : AFERL                      mm
!     DEN ANBRINGES SÅ NÆR MIDTEN SOM MULIGT OP TIL NÆRMESTE ØJE OG REGNES STIV.
!     DEN MEDTAGES FØRST I BJÆLKEBEREGNINGEN EFTER INITIALISERINGSPROGRAMMET
!     AFSTAND MELLEM SKRUER         : AJIG                       mm    I HØVLELÆRE (JIG)
!  ***   5' input linie ************************************************
!     SNØRENS VINKEL MED HÅNDTAGET  : VISH,NYVISH       ca. 90 grader
!     VINKEL MELLEM STANGENS TANGENT I SPIDSEN OG
!     HÅNDTAGET                     : VISP       ca. 60 grader
!     SPIRALPARAMETER, NORMALENS
!     VINKEL MED RADIUSVEKTOR       : ALFA , NORMALT >0, MEN ALFA KAN VÆRE NEGATIV,
!     ALFA = 0 SVARER TIL CIRKELFORMET UDBØJNING. STOR POSITIV ALFA GIVER STIV STANG:
!     D.V.S. MINDRE VANDRET UDBØJNING FOR SAMME KRAFT
!
!   *****  output tabeller og tilsvarende plot *************************
!     koordinatsystemets begyndelsespunkt ligger nederst i håndtaget,
!     derfor begynder udbøjningen først efter håndtaget 
!   ********************************************************************
!
INTEGER(2)          status, style
INTEGER(2)          xwidth, yheight, cols, rows
INTEGER(4)          bkcolor,rgbcolor,oldcolor
INTEGER(4)          i4,event,ix,iy
CHARACTER(17)		  AFORM
CHARACTER(44)		  EFORM
CHARACTER(256)		  text
LOGICAL             menustat
TYPE (windowconfig) myscreen
TYPE (wxycoord)     wxy
TYPE (wxycoord)     poly(4)
TYPE (rccoord)      curpos
COMMON              myscreen
INTEGER control_name
INTEGER callbacktype
LOGICAL             OMIGEN,SETREF
EXTERNAL HENTFIL, HENTDATA, HENTLAST
!     Set the screen to the best resolution and maximum number of 
!     available colors.
myscreen.numxpixels   = -1
myscreen.numypixels   = -1
myscreen.numtextcols  = -1
myscreen.numtextrows  = -1
myscreen.numcolors    = -1
myscreen.fontsize = -1
menustat = DELETEMENUQQ( 4, 1 )
menustat = INSERTMENUQQ( 4, 1 , $MENUENABLE , "&FindFil"C , HENTFIL )
! menustat = DELETEMENUQQ( 1, 2 )
menustat = INSERTMENUQQ( 4, 2 , $MENUENABLE , '&OmIgen'C, HENTDATA )
! menustat = DELETEMENUQQ( 1, 3 )
menustat = INSERTMENUQQ( 4, 3 , $MENUENABLE , '&Nylast'C, HENTLAST )
! menustat = DELETEMENUQQ( 1, 4 )
! menustat = INSERTMENUQQ( 1, 4 , $MENUSEPARATOR , 'sel'C, WINPRINT )
! menustat = DELETEMENUQQ( 1, 5 )
! menustat = INSERTMENUQQ( 1, 5 , $MENUENABLE , '&PRINT'C, WINPRINT )
! menustat = DELETEMENUQQ( 1, 6 )
! menustat = INSERTMENUQQ( 1, 6 , $MENUENABLE , 'E&xit'C, WINEXIT )
numfonts = INITIALIZEFONTS ( )
AABEN = .FALSE.
!
PIHALV = DATAN(1.0_8)*2.0_8
PI = PIHALV*2.0_8
TOPI = PI*2.0_8
RAD = PIHALV/90.0_8
GRAD = 1.0_8/RAD
VISH = 0.0
TRIS = 0.0
FNUX = 0.0D0
FNUY = 0.0D0
! REFF ER REFERENCEKRAFT, SOM GIVER UDBØJNING 0.05 * STANGLÆNGDE STAL.
REFF = 0.0
!  FIL TIL NØDUDSKRIFTER
OPEN(8,FILE='stangud.out',STATUS="UNKNOWN",&
ACCESS="SEQUENTIAL", IOSTAT=IRET)
ISTA = 0
IF ( IRET .NE. 0 ) THEN
   WRITE(6,EFORM) 8,'stangud.out',IRET
	PAUSE
   STOP
ENDIF
WRITE(AFORM,11000) LEFIL
11000 FORMAT("(I4,' |',A",I2,",'|')")
WRITE(EFORM,10000) LEFIL
10000 FORMAT("(' OPEN ERROR, UNIT',I2,' |',A"I2",'| IR=',I3)")
IFASE = 1 
WRITE(8,10101) IFASE,1
10101 FORMAT(' STANG:IFASE=',I1,' SET AT POINT',I3)
FIL = 'STANG'
ISTA = 5
!
DO WHILE ( IFASE .GT. 0 )
!
	IF ( IFASE .LE. 1 ) THEN
		SETREF = .TRUE.
		ERDER = .FALSE.
		CALL FILDIALOG
		IF ( FIL .EQ. ' ' ) THEN
			write(6,*) "Blank Fil"
			write(8,*) "Blank Fil"
			ISTA = 0
			I4 = MESSAGEBOXQQ('DATAFIL *.DAT'C , 'FIND INPUTFIL'C , MB$OK )
			OPEN(2,FILE=' ' )
			INQUIRE (UNIT=2, NAME=FILI)
			ERDER = .TRUE.
			WRITE (6,*) FILI
			ISTA4 = LEN_TRIM(FILI)
			ISTA = ISTA4-4

			WRITE(6,AFORM) ISTA4,FILI
			WRITE(8,AFORM) ISTA4,FILI
			FILO = FILI
			FILO(ISTA4-2:ISTA4) = 'OUT'
			FIL = FILI(1:ISTA)
			IF ( IRET .NE. 0 ) THEN
				WRITE(6,EFORM) 2,FILO,IRET
				WRITE(8,EFORM) 2,FILO,IRET
			ELSE
				WRITE(6,AFORM) ISTA4,FILO
				WRITE(8,AFORM) ISTA4,FILO
			ENDIF
		ELSE
			FIL = ADJUSTL(FIL)
			ISTA = LEN_TRIM(FIL)
			WRITE(6,AFORM) ISTA,FIL
			WRITE(8,AFORM) ISTA,FIL
			FILI = FIL
			FILO = FIL
	!		FILGR1 = FIL
	!		FILGR2 = FIL
			ISTA1 = ISTA+1
			ISTA4 = ISTA+4
			L = ISTA4
			FILI(ISTA1:ISTA4) = '.DAT'
			FILO(ISTA1:ISTA4) = '.OUT'
			WRITE(8,AFORM) ISTA4,FILI
			WRITE(6,AFORM) ISTA4,FILI
			WRITE(8,AFORM) ISTA4,FILO
			WRITE(6,AFORM) ISTA4,FILO
	!		FILGR1(J+1:J+1) = '1'
	!		FILGR2(J+1:J+1) = '2'
	!
	!		INQUIRE: om inputfilen er der:
			INQUIRE (FILE = FILI, EXIST = ERDER)
			WRITE(6,*) ' ! ERDER=',ERDER
			WRITE(8,*) ' ! ERDER=',ERDER
			OPEN(2,FILE=FILI,STATUS="UNKNOWN",&
			ACCESS="SEQUENTIAL", IOSTAT=IRET)
			WRITE(6,AFORM) 1,FILI
			IF ( IRET .NE. 0 ) THEN
				WRITE(6,EFORM) 2,FILI,IRET
				WRITE(8,EFORM) 2,FILI,IRET
			ENDIF
		ENDIF
		IFASE = 2 
		WRITE(8,10101) IFASE,2
		IF ( ERDER ) THEN
			READ(2,*) NKANT,NEYE,NELE
			READ(2,*) EMOD,RHO,NYTRIS
			READ(2,*) STAL,HAND,AFST,SPIDS
			READ(2,*) REYE,HEY1,HEY2,AJIG,FERL,AFERL
			READ(2,*) NYVISH,VISP,ALFA
		ELSE
		!  DEFAULT VÆRDIER : 
			WRITE(8,*) ' NY OUTPUTFIL:'
			WRITE(8,AFORM) 2,FILO
			WRITE(6,AFORM) 2,FILO
			WRITE(6,*) ' DEFAULT VÆRDIER SÆTTES!'
			WRITE(8,*) ' DEFAULT VÆRDIER SÆTTES!'
			NKANT = 6
			!NEYE = 7
			!NELE = 49
			!EMOD  = 25000._8
			!RHO = 0.9_8
			!NYTRIS = 0.5_8
			!STAL = 1800._8
			!HAND = 300._8
			!AFST = 200._8
			!SPIDS = 3._8
			!REYE = 2._8
			!HEY1 = 8._8
			!HEY2 = 20._8
			!AJIG = 152.4_8
			!FERL = 100._8
			!AFERL = 10._8
			!NYVISH = 90._8
			!VISP = 30._8
			!ALFA = 0.0_8 
			!
			NEYE = 8
			NELE = 30
			EMOD  = 25000._8
			RHO = 1.1_8
			NYTRIS = 0.2_8
			STAL = 2286._8
			HAND = 260._8
			AFST = 400._8
			SPIDS = 1.6_8
			REYE = 3.3_8
			HEY1 = 5._8
			HEY2 = 8._8
			AJIG = 127._8
			FERL = 80._8
			AFERL = 15._8
			NYVISH = 95._8
			VISP = 60._8
			ALFA = 70.0_8 
			WRITE(6,*) ' DEFAULT VÆRDIER SAT!'
			WRITE(8,*) ' DEFAULT VÆRDIER SAT!'
		ENDIF
		WRITE(8,*) ' NY OUTPUTFIL:'
		WRITE(8,AFORM) 2,FILO
		WRITE(6,AFORM) 2,FILO
		OPEN(7,FILE=FILO,STATUS="UNKNOWN",&
		ACCESS="SEQUENTIAL", IOSTAT=IRET)
		IF ( IRET .NE. 0 ) THEN
			WRITE(6,EFORM) 7,FILI,IRET
			WRITE(8,EFORM) 7,FILI,IRET
			STOP
		ENDIF
		!
		WRITE(6,AFORM) 3,FILI
		WRITE(6,AFORM) 4,FILO
		WRITE(7,AFORM) 3,FILI
		WRITE(7,AFORM) 4,FILO
!		WRITE(7,AFORM) FILGR1
!		WRITE(7,AFORM) FILGR2
!
	ENDIF
!
!     DEFINER STANGDIMENSIONER
!
	NKANT = MAX(3,NKANT)
	NEYE  = MAX(3,NEYE)
	NELE  = MIN(NELX-1,NELE)
	NELE  = MAX(30,NELE)
	IF ( IFASE .EQ. 2 ) THEN
		OMIGEN = .TRUE.
		DO WHILE ( OMIGEN )
			CALL DATADIALOG
			OMIGEN = .FALSE.
			IF ( ALFA > 89.0 ) THEN 
				WRITE(6,*) ' SPIRALPARAMETER > 89',ALFA
				WRITE(7,*) ' SPIRALPARAMETER > 89',ALFA
				WRITE(8,*) ' SPIRALPARAMETER > 89',ALFA
				ALFA = 89.0
				OMIGEN = .TRUE.
			ENDIF
			IF ( VISP > NYVISH ) THEN
				WRITE(6,*) ' VINKEL I SPIDS > SNØREVINKEL:',VISP,NYVISH
				WRITE(7,*) ' VINKEL I SPIDS > SNØREVINKEL:',VISP,NYVISH
				WRITE(8,*) ' VINKEL I SPIDS > SNØREVINKEL:',VISP,NYVISH
				VISP = 0.99*NYVISH
				OMIGEN = .TRUE.
			ENDIF
		ENDDO
		NKANT = MAX(3,NKANT)
		NEYE  = MAX(3,NEYE)
		NELE  = MIN(NELX-1,NELE)
		NELE  = MAX(29,NELE)
	33330 FORMAT(3(I8,' ,'))
	33331 FORMAT(6(F8.1,' ,'))
!
		CALL STANGINIT
		REWIND(2)
!
		WRITE(2,33330) NKANT,NEYE,NELE
		WRITE(2,33331) EMOD,RHO,NYTRIS
		WRITE(2,33331) STAL,HAND,AFST,SPIDS
		WRITE(2,33331) REYE,HEY1,HEY2,AJIG,FERL,AFERL
		WRITE(2,33331) NYVISH,VISP,ALFA
		N1 = NEYE+1
		DO I = 2,N1
			WRITE(2,33331) ZEYE(I)
		ENDDO
		DO I = 0,NEL
			WRITE(2,33331) XL(I),RR(I)*DIAM
		ENDDO
		CLOSE(2)
!
	ENDIF
	!
	WRITE(7,*) ' STANG:SETREF=',SETREF
	IF ( SETREF ) THEN
		DO I = 1,N1
			XYF(1,I) = ZEYE(I)
			XYF(2,I) = HH(I)
		ENDDO
		DO I = 0,NEL
			XG(1,I) = XL(I)
			XG(2,I) = 0.0D0
		ENDDO
		FNX = 0.0D0
		FNY = 0.01D0
		DFY = STAL
		RDEF = STAL*0.05
		DYL = STAL*1.0D-8
		D = 0.0D0
		ITERA = 0
		WRITE(7,*) ' STANG:DFY,RDEF,DYL=',DFY,RDEF,DYL
		WRITE(7,*) ' STANG:ITERA,D=',ITERA,D
		DO WHILE (abs(dfy) .gt. dyl )
			itera = itera+1
			d = xyg(2,n1)
			fol = fny
			call forces(fnx,fny,neyx,n1,hh,zeye,xyf,ff)
			call bend(emod,bimo,nhand,hand,neyx,n1,hh,zeye,xyf,xyg,ff,nelx,nel,rr,xl,xg)
			dy = xyg(2,n1)
			dela = 0.0d0
			delb = 1.0d0-dela
			fny = dela*fol+delb*fny*rdef/dy
			dfy = dy-d
			write(7,45678) itera,d,dy,dfy
	45678 format(' stang:d,dy,dfy=',i3,3d22.14)
			if ( itera > 30 ) stop
		enddo
		reff = fny
		write(7,*) ' stang:reff=',reff
		setref = .false.
	endif
	WRITE(7,*) ' IFASE2',IFASE
	WRITE(8,*) ' IFASE2',IFASE
	IF ( IFASE .GE. 3 ) THEN
		WRITE(7,*) ' IFASE3',IFASE
		WRITE(8,*) ' IFASE3',IFASE
		TRIS = NYTRIS
		VISH = NYVISH
		NYTRIS = 0.0D0
		DO WHILE ( ABS(NYTRIS) < 1.0D-8 .OR. ((TRIS .EQ. NYTRIS) .AND. (VISH .EQ. NYVISH) ) )
			WRITE(7,*) ' IFASE4',IFASE
			WRITE(8,*) ' IFASE4',IFASE
			CALL LASTDIALOG
			IF ( ABS(NYTRIS) < 0.0D-8 ) THEN
				VISH = 0.0
				TRIS = 0.0
				FOLX = 0.0D0
				FOLY = 0.0D0
				XD = 0.0D0
				XG = 0.0D0
				FF = 0.0D0
				XYF = 0.0D0
				XYG = 0.0D0
				I4 = MESSAGEBOXQQ( 'Snøretræk=0 nulstiller!'C ,&
										 'kræfter og udbøjninger!'C , MB$OK )
			ELSEIF ((TRIS .EQ. NYTRIS) .AND. (VISH .EQ. NYVISH)) THEN
				I4 = MESSAGEBOXQQ( 'Indlæs nyt snøretræk'C ,&
										 'eller ny snørevinkel!'C , MB$OK )
			ENDIF
		ENDDO
	ENDIF
!
!	ii = ModifyMenuFlagsQQ( 1, 1, $MENUENABLED )
!	ii = ModifyMenuFlagsQQ( 1, 2, $MENUENABLED )
!	ii = ModifyMenuFlagsQQ( 1, 3, $MENUENABLED )
!	event = MOUSE$MOVE
!	event = IOR (event, MOUSE$LBUTTONUP)
!	event = IOR (event, MOUSE$LBUTTONDOWN)
!	event = IOR (event, MOUSE$LBUTTONDBLCLK)
	I4 = FOCUSQQ(5)
!  i4 = registermouseevent(MOUSE$LBUTTONDOWN, i4, ix, iy)
	WRITE(7,*) ' IFASE5',IFASE
	WRITE(8,*) ' IFASE5',IFASE
	WRITE(6,*) ' INPUT: <1 STOP! 1 NYT FILNAVN; 2 DATA ÆNDRES; 3 NY LAST.'
	WRITE(8,10101) IFASE,3
	CALL CALCPLOT
	READ(5,*) IFASE
	WRITE(6,10101) IFASE,4
	WRITE(7,10101) IFASE,4
	WRITE(8,10101) IFASE,4
	IF ( IFASE .LE. 1 ) THEN
		CLOSE(2)
		CLOSE(7)
	ENDIF
ENDDO
CLOSE(8)
!
END
