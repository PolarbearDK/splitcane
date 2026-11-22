# Microsoft Developer Studio Project File - Name="STANGBYGNING1" - Package Owner=<4>
# Microsoft Developer Studio Generated Build File, Format Version 5.00
# ** DO NOT EDIT **

# TARGTYPE "Win32 (x86) QuickWin Application" 0x0107

CFG=STANGBYGNING1 - Win32 Debug
!MESSAGE This is not a valid makefile. To build this project using NMAKE,
!MESSAGE use the Export Makefile command and run
!MESSAGE 
!MESSAGE NMAKE /f "STANGBYGNING1.MAK".
!MESSAGE 
!MESSAGE You can specify a configuration when running NMAKE
!MESSAGE by defining the macro CFG on the command line. For example:
!MESSAGE 
!MESSAGE NMAKE /f "STANGBYGNING1.MAK" CFG="STANGBYGNING1 - Win32 Debug"
!MESSAGE 
!MESSAGE Possible choices for configuration are:
!MESSAGE 
!MESSAGE "STANGBYGNING1 - Win32 Release" (based on\
 "Win32 (x86) QuickWin Application")
!MESSAGE "STANGBYGNING1 - Win32 Debug" (based on\
 "Win32 (x86) QuickWin Application")
!MESSAGE 

# Begin Project
# PROP Scc_ProjName ""
# PROP Scc_LocalPath ""
F90=df.exe
MTL=midl.exe
RSC=rc.exe

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

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
# ADD BASE F90 /include:"Release/" /compile_only /nologo /libs:qwin /warn:nofileopt
# ADD F90 /include:"Release/" /compile_only /nologo /libs:qwin /warn:nofileopt
# ADD BASE MTL /nologo /D "NDEBUG" /mktyplib203 /o NUL /win32
# ADD MTL /nologo /D "NDEBUG" /mktyplib203 /o NUL /win32
# ADD BASE RSC /l 0x406 /d "NDEBUG"
# ADD RSC /l 0x406 /d "NDEBUG"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 kernel32.lib /nologo /entry:"WinMainCRTStartup" /subsystem:windows /machine:I386 /nodefaultlib:"dfconsol.lib"
# ADD LINK32 kernel32.lib /nologo /entry:"WinMainCRTStartup" /subsystem:windows /machine:I386 /nodefaultlib:"dfconsol.lib"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

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
# ADD BASE F90 /include:"Debug/" /compile_only /nologo /libs:qwin /debug:full /optimize:0 /warn:nofileopt
# ADD F90 /browser /include:"Debug/" /compile_only /nologo /libs:qwin /debug:full /optimize:0 /warn:nofileopt
# ADD BASE MTL /nologo /D "_DEBUG" /mktyplib203 /o NUL /win32
# ADD MTL /nologo /D "_DEBUG" /mktyplib203 /o NUL /win32
# ADD BASE RSC /l 0x406 /d "_DEBUG"
# ADD RSC /l 0x406 /d "_DEBUG"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 kernel32.lib /nologo /entry:"WinMainCRTStartup" /subsystem:windows /debug /machine:I386 /nodefaultlib:"dfconsol.lib" /pdbtype:sept
# ADD LINK32 kernel32.lib /nologo /entry:"WinMainCRTStartup" /subsystem:windows /debug /machine:I386 /nodefaultlib:"dfconsol.lib" /pdbtype:sept

!ENDIF 

# Begin Target

# Name "STANGBYGNING1 - Win32 Release"
# Name "STANGBYGNING1 - Win32 Debug"
# Begin Source File

SOURCE=.\Stangbygning1\BEAM.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_BEAM_=\
	".\Debug\STANGMOD.MOD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\Bend.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\BMOMENT.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\CALCPLOT.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_CALCP=\
	".\Debug\STANGMOD.MOD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\CHEBUD.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\CHEPOL.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\Datadialog.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_DATAD=\
	".\Debug\STANGMOD.MOD"\
	".\Stangbygning1\RESOURCE.FD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\FILDIALOG.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_FILDI=\
	".\Debug\STANGMOD.MOD"\
	".\Stangbygning1\RESOURCE.FD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\FORCES.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\GAUELI.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\Debug\gridshape.obj
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\HENTDATA.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_HENTD=\
	".\Debug\STANGMOD.MOD"\
	".\Stangbygning1\RESOURCE.FD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\Hentfil.f90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_HENTF=\
	".\Debug\STANGMOD.MOD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\Hentlast.f90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_HENTL=\
	".\Debug\STANGMOD.MOD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\INITIALSETTINGS.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\lastdialog.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_LASTD=\
	".\Debug\STANGMOD.MOD"\
	".\Stangbygning1\RESOURCE.FD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\RESOURCE.FD
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\RESOURCE.RC
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\Debug\SCALIN.obj
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\SOLSYM.F90
# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\STANG.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_STANG=\
	".\Debug\STANGMOD.MOD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\STANGINIT.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

DEP_F90_STANGI=\
	".\Debug\STANGMOD.MOD"\
	

!ENDIF 

# End Source File
# Begin Source File

SOURCE=.\Stangbygning1\STANGMOD.F90

!IF  "$(CFG)" == "STANGBYGNING1 - Win32 Release"

!ELSEIF  "$(CFG)" == "STANGBYGNING1 - Win32 Debug"

!ENDIF 

# End Source File
# End Target
# End Project
