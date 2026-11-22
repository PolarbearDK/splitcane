SUBROUTINE SOLSYM(AA,FF,X,NN,NNMAX,NHS,NHSMAX,INV,ERR)
IMPLICIT DOUBLE PRECISION (A-H,O-Z)
!=======================================================================
!                   PRODUCT OF B&W DIESEL A/S
!                   COPENHAGEN        DENMARK
!=======================================================================
!
!  PROGRAMMED BY      :   BWE 2430                 DATE   :   81
!
!  CORRECTED BY       :   BWE 2430 CF              DATE   :   81
!
!=======================================================================
!
!                            ======
!  NAME               :      SOLSYM
!                            ======
!  MNEMONIC           : SOLUTION OF A LINEAR SYMMETRIC
!                     : SOL           L      SYM
!                     : SYSTEM OF EQUATIONS
!                     : SY   M
!
!  METHOD             : LDL DEKOMPOSITION OG TILBAGESUBSTITUTION.
!
!=======================================================================
!                   +-----------------------+
!                   I       INTERFACE       I
!                   +-----------------------+
!
!  INPUT ARGUMENTS    : AA(1:NNMAX,1:NNMAX) LININGSMATRIX
!                     : FF(1:NNMAX,1:NHSMAX) HØJRESIDER
!                     : XX(1:NNMAX,1:NHSMAX) LØSNINGER
!                     : NN = ANTAL LIGNINGER.
!                     : NNMAX = DIMENSION AF MATRICER.
!                     : NHS = ANTAL HØJRESIDER.
!                     : MAXNHS = MAX.ANTAL HØJRESIDER.
!
!
! OUTPUT ARGUMENTS    : ERR : FEJLPARAMETER
!
!  FUNCTIONS EXTERNAL : DABS
!
!%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
!
!***  SOLUTION OF A SYSTEM OF LINEAR EQUATIONS WITH A SYMMETRIC,
!     INDEFINITE SQUARE MATRIX.
!     NN : ACTUAL NUMBER OF UNKNOWNS
!     NNMAX : MAX. PERMISSIBLE NUMBER OF UNKNOWNS
!     NHS : ACTUAL NUMBER OF RIGHT HAND SIDES.
!     NHSMAX : MAX. PERMISSIBLE NUMBER OF RIGHT HAND SIDES.
!     AA : ARRAY ( AA(NNMAX,NNMAX) ) CONTAINING THE MATRIX.
!     FF : ARRAY ( FF(NNMAX,NHSMAX) ) RIGHT-HAND SIDE
!     X  : ARRAY ( X(NNMAX,NHSMAX) ) CONTAINING THE UNKNOWNS.
!     INV: INV=.TRUE. : AA IS THE INVERTED COEFFICIENT-MATRIX
!          INV=.FALSE. : AA IS NOT INVERTED
!     ERR: ERR=.TRUE. : THE SYSTEM OF EQUATIONS IS LINEARLY DEPENDENT
!          ERR=.FALSE. : THE SYSTEM OF EQUATIONS IS LINEARLY
!***                     INDEPENDENT. SOLUTION CAN BE PERFORMED.
!
DIMENSION AA(NNMAX,NNMAX),FF(NNMAX,NHSMAX),X(NNMAX,NHSMAX)
!
LOGICAL ERR,INV
!
ERR = .FALSE.
!
!***  INV=.FALSE.
!
IF (.NOT. INV) THEN
!  !
!  !***  START TRIANGULATION
!  !
   DO I = 1,NN    
      DO J = I,NN    
         KB = I-1
         A = 0.D0
         DO K = 1,KB   
            A = A+AA(K,I)*AA(K,J)/AA(K,K)
         ENDDO
         IF (J .EQ. I) THEN
            DABSO = DABS(A)+DABS(AA(I,I))
            A = AA(I,I)-A
            AA(I,I) = A
            IF (DABS(A)/DABSO .LT. 1.D-12) THEN
11111 FORMAT(1H0,5X,'**** EQUATIONS IN SOLSYM ARE LINEARLY',&
        ' DEPENDENT. LINE NO.',I3)
               WRITE(6,11111) I
               ERR = .TRUE.
               RETURN
            ENDIF
         ELSE
            AA(I,J) = AA(I,J)-A
         ENDIF
      ENDDO
   ENDDO
ENDIF
!
!***  INV=.TRUE. ,START
!
DO I = 1,NN    
   KB = I-1
   DO L = 1,NHS    
      X(I,L) = FF(I,L)
      A = 0.D0
      DO K = 1,KB    
         A = A+AA(K,I)*X(K,L)/AA(K,K)
      ENDDO
      X(I,L) = X(I,L)-A
   ENDDO
ENDDO
!
!**   END TRIANGULATION
!
!**   START BACKSUBSTITUTION
!
IF (.NOT. ERR) THEN
   I = NN
!  !         WHILE (I .GT. 0) DO
 330  IF (I .GT. 0) THEN   
      JB = I+1
      DO L = 1,NHS    
         A = 0.D0
         DO J = JB,NN    
            A = A+AA(I,J)*X(J,L)
         ENDDO
         X(I,L) = (X(I,L)-A)/AA(I,I)
      ENDDO
      I = I-1
      GO TO 330
   ENDIF
ENDIF
!
!**   END BACKSUBSTITUTION
!
RETURN
END
