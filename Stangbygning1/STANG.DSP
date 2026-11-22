# Microsoft Developer Studio Project File - Name="STANG" - Package Owner=<4>
# Microsoft Developer Studio Generated Build File, Format Version 5.00
# ** DO NOT EDIT **

# TARGTYPE "Win32 (x86) Console Application" 0x0103

CFG=STANG - Win32 Debug
!MESSAGE This is not a valid makefile. To build this project using NMAKE,
!MESSAGE use the Export Makefile command and run
!MESSAGE 
!MESSAGE NMAKE /f "STANG.MAK".
!MESSAGE 
!MESSAGE You can specify a configuration when running NMAKE
!MESSAGE by defining the macro CFG on the command line. For example:
!MESSAGE 
!MESSAGE NMAKE /f "STANG.MAK" CFG="STANG - Win32 Debug"
!MESSAGE 
!MESSAGE Possible choices for configuration are:
!MESSAGE 
!MESSAGE "STANG - Win32 Release" (based on "Win32 (x86) Console Application")
!MESSAGE "STANG - Win32 Debug" (based on "Win32 (x86) Console Application")
!MESSAGE 

# Begin Project
# PROP Scc_ProjName ""
# PROP Scc_LocalPath ""
F90=df.exe
RSC=rc.exe

!IF  "$(CFG)" == "STANG - Win32 Release"

# PROP BASE Use_MFC 0
# PROP BASE Use_Debug_Libraries 0
# PROP BASE Output_Dir "Release"
# PROP BASE Intermediate_Dir "Release"
# PROP BASE Target_Dir ""
# PROP Use_MFC 0
# PROP Use_Debug_Libraries 0
# PROP Output_Dir "Release"
# PROP Intermediate_Dir "Release"
# PROP Target_Dir ""
# ADD BASE F90 /include:"Release/" /compile_only /nologo /warn:nofileopt
# ADD F90 /include:"Release/" /compile_only /nologo /warn:nofileopt
# ADD BASE RSC /l 0x406 /d "NDEBUG"
# ADD RSC /l 0x406 /d "NDEBUG"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 kernel32.lib /nologo /subsystem:console /machine:I386
# ADD LINK32 kernel32.lib /nologo /subsystem:console /machine:I386

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

# PROP BASE Use_MFC 0
# PROP BASE Use_Debug_Libraries 1
# PROP BASE Output_Dir "Debug"
# PROP BASE Intermediate_Dir "Debug"
# PROP BASE Target_Dir ""
# PROP Use_MFC 0
# PROP Use_Debug_Libraries 1
# PROP Output_Dir "Debug"
# PROP Intermediate_Dir "Debug"
# PROP Target_Dir ""
# ADD BASE F90 /include:"Debug/" /compile_only /nologo /debug:full /optimize:0 /warn:nofileopt
# ADD F90 /browser /include:"Debug/" /compile_only /nologo /debug:full /optimize:0 /warn:nofileopt
# ADD BASE RSC /l 0x406 /d "_DEBUG"
# ADD RSC /l 0x406 /d "_DEBUG"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 kernel32.lib /nologo /subsystem:console /debug /machine:I386 /pdbtype:sept
# ADD LINK32 kernel32.lib /nologo /subsystem:console /debug /machine:I386 /pdbtype:sept

!ENDIF 

# Begin Target

# Name "STANG - Win32 Release"
# Name "STANG - Win32 Debug"
# Begin Source File

SOURCE=.\BEAM.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

DEP_F90_BEAM_=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Bend.F90
# End Source File
# Begin Source File

SOURCE=.\BMOMENT.F90
# End Source File
# Begin Source File

SOURCE=.\CALCPLOT.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

NODEP_F90_CALCP=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

NODEP_F90_CALCP=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\CHEBUD.F90
# End Source File
# Begin Source File

SOURCE=.\CHEPOL.F90
# End Source File
# Begin Source File

SOURCE=.\Datadialog.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

DEP_F90_DATAD=\
	".\RESOURCE.FD"\
	
NODEP_F90_DATAD=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

DEP_F90_DATAD=\
	".\RESOURCE.FD"\
	
NODEP_F90_DATAD=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\FILDIALOG.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

DEP_F90_FILDI=\
	".\RESOURCE.FD"\
	
NODEP_F90_FILDI=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

DEP_F90_FILDI=\
	".\RESOURCE.FD"\
	
NODEP_F90_FILDI=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\FORCES.F90
# End Source File
# Begin Source File

SOURCE=.\GAUELI.F90
# End Source File
# Begin Source File

SOURCE=.\HENTDATA.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

DEP_F90_HENTD=\
	".\RESOURCE.FD"\
	
NODEP_F90_HENTD=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

DEP_F90_HENTD=\
	".\RESOURCE.FD"\
	
NODEP_F90_HENTD=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Hentfil.f90

!IF  "$(CFG)" == "STANG - Win32 Release"

NODEP_F90_HENTF=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

NODEP_F90_HENTF=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Hentlast.f90

!IF  "$(CFG)" == "STANG - Win32 Release"

NODEP_F90_HENTL=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

NODEP_F90_HENTL=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\INITIALSETTINGS.F90
# End Source File
# Begin Source File

SOURCE=.\lastdialog.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

DEP_F90_LASTD=\
	".\RESOURCE.FD"\
	
NODEP_F90_LASTD=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

DEP_F90_LASTD=\
	".\RESOURCE.FD"\
	
NODEP_F90_LASTD=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\RESOURCE.FD
# End Source File
# Begin Source File

SOURCE=.\RESOURCE.RC

!IF  "$(CFG)" == "STANG - Win32 Release"

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\SOLSYM.F90
# End Source File
# Begin Source File

SOURCE=.\STANG.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

NODEP_F90_STANG=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

NODEP_F90_STANG=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\STANGINIT.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

NODEP_F90_STANGI=\
	".\Release\STANGMOD.mod"\
	

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

NODEP_F90_STANGI=\
	".\Debug\STANGMOD.mod"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\STANGMOD.F90

!IF  "$(CFG)" == "STANG - Win32 Release"

!ELSEIF  "$(CFG)" == "STANG - Win32 Debug"

!ENDIF 

# End Source File
# End Target
# End Project
