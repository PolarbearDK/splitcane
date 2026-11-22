SUBROUTINE DATADIALOG
USE DFLOGM
USE STANGMOD
IMPLICIT INTEGER(4) (I-N), REAL(8) (A-H,O-Z)
TYPE (dialog) dlg
INCLUDE 'resource.fd'
LOGICAL retdlg, retlog
CHARACTER(256) text
!
! FØRSTE SØJLE
retdlg = DLGINIT( IDD_DIALOG3, dlg )
WRITE (text,*) NKANT
retlog = DlgSet( dlg, IDC_EDIT_NKANT,TRIM(ADJUSTL(text)) )
WRITE (text,*) NEYE
retlog = DlgSet( dlg, IDC_EDIT_NEYE,TRIM(ADJUSTL(text)) )
WRITE (text,*) NELE
retlog = DlgSet( dlg, IDC_EDIT_NELE,TRIM(ADJUSTL(text)) )
WRITE (text,'(F9.2)') STAL
retlog = DlgSet( dlg, IDC_EDIT_STAL,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') HAND
retlog = DlgSet( dlg, IDC_EDIT_HAND,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') AFST
retlog = DlgSet( dlg, IDC_EDIT_AFST,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') SPIDS
retlog = DlgSet( dlg, IDC_EDIT_SPIDS,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') REYE
retlog = DlgSet( dlg, IDC_EDIT_REYE,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') HEY1
retlog = DlgSet( dlg, IDC_EDIT_HEY1,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') HEY2
! ANDEN SØJLE
retlog = DlgSet( dlg, IDC_EDIT_HEY2,TRIM(ADJUSTL(text)) )
WRITE (text,'(F8.1)') EMOD
retlog = DlgSet( dlg, IDC_EDIT_EMOD,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.3)') RHO
retlog = DlgSet( dlg, IDC_EDIT_RHO ,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') NYTRIS
retlog = DlgSet( dlg, IDC_EDIT_NYTRIS,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') NYVISH
retlog = DlgSet( dlg, IDC_EDIT_NYVISH,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') VISP
retlog = DlgSet( dlg, IDC_EDIT_VISP,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') ALFA
retlog = DlgSet( dlg, IDC_EDIT_ALFA,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') FERL
retlog = DlgSet( dlg, IDC_EDIT_FERL,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') AFERL
retlog = DlgSet( dlg, IDC_EDIT_AFERL,TRIM(ADJUSTL(text)) )
WRITE (text,'(F6.2)') AJIG
retlog = DlgSet( dlg, IDC_EDIT_AJIG,TRIM(ADJUSTL(text)) )
intret = DLGMODAL (dlg)
!
WRITE(7,*) INTRET
IF ( INTRET .NE. IDOK ) THEN
	IF ( INTRET .EQ. IDCANCEL ) THEN
		WRITE(7,*) ' DIALOG CANCELLED, PROGRAM STOPPED'
	ELSE
		WRITE(7,*) ' DIALOG ERROR, PROGRAM STOPPED'
	ENDIF
	STOP
ENDIF
! FØRSTE SØJLE
retlog = DlgGet( dlg, IDC_EDIT_NKANT,text )
read(text,*) NKANT
retlog = DlgGet( dlg, IDC_EDIT_NEYE,text )
read(text,*) NEYE
retlog = DlgGet( dlg, IDC_EDIT_NELE,text )
read(text,*) NELE
retlog = DlgGet( dlg, IDC_EDIT_REYE,text )
read(text,*) REYE
retlog = DlgGet( dlg, IDC_EDIT_STAL,text )
read(text,*) STAL
retlog = DlgGet( dlg, IDC_EDIT_HAND,text )
read(text,*) HAND
retlog = DlgGet( dlg, IDC_EDIT_AFST,text )
read(text,*) AFST
retlog = DlgGet( dlg, IDC_EDIT_SPIDS,text )
read(text,*) SPIDS
retlog = DlgGet( dlg, IDC_EDIT_REYE,text )
read(text,*) REYE
retlog = DlgGet( dlg, IDC_EDIT_HEY1,text )
read(text,*) HEY1
retlog = DlgGet( dlg, IDC_EDIT_HEY2,text )
read(text,*) HEY2
! ANDEN SØJLE
retlog = DlgGet( dlg, IDC_EDIT_EMOD,text )
read(text,*) EMOD
WRITE(7,*) ' DATA EMOD:',EMOD
retlog = DlgGet( dlg, IDC_EDIT_RHO ,text )
read(text,*) RHO
retlog = DlgGet( dlg, IDC_EDIT_NYTRIS,text )
read(text,*) NYTRIS
retlog = DlgGet( dlg, IDC_EDIT_NYVISH,text )
read(text,*) NYVISH
retlog = DlgGet( dlg, IDC_EDIT_VISP,text )
read(text,*) VISP
retlog = DlgGet( dlg, IDC_EDIT_ALFA,text )
read(text,*) ALFA
retlog = DlgGet( dlg, IDC_EDIT_FERL,text )
read(text,*) FERL
retlog = DlgGet( dlg, IDC_EDIT_AFERL,text )
read(text,*) AFERL
retlog = DlgGet( dlg, IDC_EDIT_AJIG,text )
read(text,*) AJIG
END SUBROUTINE DATADIALOG
