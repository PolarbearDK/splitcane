SUBROUTINE CHEPOL(NGR,X,TT)
IMPLICIT INTEGER(4) (I-N) , REAL(8) (A-H,O-Z)
!
!   ****************************************************
!     SUBROUTINE TIL BEREGNING AF CHEBYCHEV POLYNOMIER
!            VIGGO HOPPE, 1 JUNI 2000
!   ****************************************************
REAL(8) TT(*)
N = NGR+1
TT(1) = 1.0D0
TT(2) = X
DO J = 3,N
	TT(J) = 2*X*TT(J-1)-TT(J-2)
ENDDO
! WRITE(7,76500) X,(TT(J),J=1,N)
!76500 FORMAT(' CHBTTT:',F11.4,6F11.7)
END