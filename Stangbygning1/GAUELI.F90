SUBROUTINE GAUELI(A,X,N,M,NMAX,EPS,IRANK,IERR)
!=======================================================================
!                   PRODUCT OF MAN B&W DIESEL A/S
!                   COPENHAGEN            DENMARK
!=======================================================================
!
!   PROGRAMMED BY      :   STEFFEN RICHTER NIELSEN
!   REVISION 1         :   BO HANSEN
!   REVISION 3.0       :   KIM RAVN-JENSEN             DATE:    2/6 1987
!
!=======================================================================
!
!                             ========
!   NAME               :       GAUELI
!                             ========
!
!   MNEMO CODE:            GAUSS ELIMINATION.
!                          GAU   ELI
!
!=======================================================================
IMPLICIT DOUBLE PRECISION (A-H,O-Z)
!=======================================================================
!
!   PERFORM GAUSS ELIMINATION WITH EQUILIBRATION AND PARTIAL PIVOTING
!   AND BACKSUBSTITUTE IN THE SYSTEM OF EQUATIONS.
!
!=======================================================================
DIMENSION A(NMAX,N),X(NMAX,M)
!=======================================================================
!                      +----------------------+
!                      I      INTERFACE       I
!                      +----------------------+
!
!   INPUT ARGUMENTS    :
!   --------------------
!
!   A       - MATRIX OF COEFFICIENTS. LEAST ALLOWABLE SIZE IS (NMAX,N).
!             THIS MATRIX IS DESTROYED BY THE SUBROUTINE.
!   X       - MATRIX OF RIGHT HAND SIDES. LEAST ALLOWABLE SIZE IS
!             (NMAX,M). IN CASE OF A NORMAL RETURN, THE CONTENTS OF 'X'
!             ARE REPLACED BY THE SOLUTIONS.
!   N       - ACTUAL NUMBER OF EQUATIONS.
!   M       - ACTUAL NUMBER OF RIGHT HAND SIDES.
!   NMAX    - FIRST DIMENSION FOR 'A' AND 'X' IN THE CALLING PROGRAM.
!   EPS     - CRITERION FOR SINGULARITY. THE VALUE 1.0D-10 MAY BE USED.
!
!   OUTPUT ARGUMENTS   :
!   --------------------
!
!   X       - MATRIX OF SOLUTION VECTORS.
!   IRANK   - RANK OF THE COEFFICIENT MATRIX 'A'.
!   IERR    - RETURN CODE:
!              = 0  FOR NORMAL RETURN.
!              = 1  IF THE COEFFICIENT MATRIX IS SINGULAR.
!
!=======================================================================
!
PARAMETER (G=6.25D-2,GG=16.0D0,EPSDEF=1.0D-10)
!
!     EQUILIBRATE FOR EACH ROW:
!
DO I=1,N  
   TN = 0.0D0
   DO J=1,N  
      TN = TN + A(I,J)*A(I,J)
   ENDDO
   TN = SQRT(TN)
   IF (TN.GT.0.0D0) THEN
      IF (TN.LT.G) THEN
!        !
!        !           IF TN < 1/16 :
!        !
         F = GG
      ELSEIF (TN.LT.1.0D0) THEN
!        !
!        !           IF 1/16 <= TN < 1 :
!        !
         F = 1.0D0
      ELSE
!        !
!        !           IF TN >= 1 :
!        !
         F = G
      ENDIF
!     !
!     !         ADJUST THE FACTOR FF SO THAT 1/16 < TN < 1. FF WILL BE EQUAL
!     !         TO THE NUMBER 16 RAISED TO SOME INTEGER POWER.
!     !
      FF = 1.D0
!     !
1001  IF ((TN.LT.G).OR.(TN.GT.1.0D0)) THEN      
         TN = TN*F
         FF = FF*F
         GOTO 1001
      ENDIF
      DO J=1,N  
         A(I,J) = A(I,J)*FF
      ENDDO
      DO J=1,M  
         X(I,J) = X(I,J)*FF
      ENDDO
   ENDIF
ENDDO
!
!     ELIMINATION WITH PARTIAL PIVOTING:
!
IRANK = N
IF (EPS.LE.0.0D0) THEN
   EPSA = EPSDEF
ELSE
   EPSA = EPS
ENDIF
!
!     FOR EACH ROW,
!
DO I=1,N-1   
!  !
!  !       FIND PIVOT ELEMENT:
!  !
   KP = I
   AA = ABS(A(I,I))
   DO II=I+1,N  
      IF (ABS(A(II,I)).GT.AA) THEN
         KP = II
         AA = ABS(A(II,I))
      ENDIF
   ENDDO
!  !
!  !       AND CHANGE ROWS
!  !
   IF (KP.NE.I) THEN
!     !
!     !         IN THE COEFFICIENT MATRIX:
!     !
      DO J=I,N  
         AA = A(I,J)
         A(I,J) = A(KP,J)
         A(KP,J) = AA
      ENDDO
!     !
!     !         AND IN THE RIGHT HAND SIDES:
!     !
      DO J=1,M  
         AA = X(I,J)
         X(I,J) = X(KP,J)
         X(KP,J) = AA
      ENDDO
   ENDIF
!  !
!  !       TEST IF THE SYSTEM IS SINGULAR:
!  !
   IF (ABS(A(I,I)).LT.EPSA) THEN
      IRANK = I - 1
      IERR = 1
      RETURN
   ENDIF
!  !
!  !       NOW FOLLOWS THE VERY ELIMINATION:
!  !
   DO II=I+1,N   
      C = -A(II,I)/A(I,I)
!     !
!     !         IN THE MATRIX:
!     !
      DO J=I+1,N  
         A(II,J) = A(II,J) + C*A(I,J)
      ENDDO
!     !
!     !         AND IN THE RIGHT HAND SIDES:
!     !
      DO J=1,M  
         X(II,J) = X(II,J) + C*X(I,J)
      ENDDO
   ENDDO
ENDDO
!
!     TEST FOR SINGULARITY:
!
IF (ABS(A(N,N)).LT.EPSA) THEN
   IRANK = N - 1
   IERR = 1
   RETURN
ENDIF
!
!     BACKSUBSTITUTION:
!
DO I=N,1,-1   
   DO JL=1,M   
      C = 0.0D0
      DO J=I+1,N   
         C = C + A(I,J)*X(J,JL)
      ENDDO
      X(I,JL) = (X(I,JL)-C)/A(I,I)
   ENDDO
ENDDO
IERR = 0
END
