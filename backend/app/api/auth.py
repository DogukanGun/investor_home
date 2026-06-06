from datetime import datetime, timedelta, timezone
import secrets
import hashlib

from fastapi import APIRouter, HTTPException, Depends, Header
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.models import User
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    email: str
    name: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


@router.post("/register", response_model=TokenResponse)
def register(
    request: RegisterRequest,
    session: Session = Depends(get_session),
    x_mobile_client: str | None = Header(default=None),
):
    if x_mobile_client != "investorhome-android":
        raise HTTPException(status_code=403, detail="Registration is only available via the mobile app")

    existing = session.exec(select(User).where(User.email == request.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        name=request.name,
        hashed_password=hash_password(request.password)
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    token = create_access_token(user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        email=user.email,
        name=user.name
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):

    user = session.exec(select(User).where(User.email == request.email)).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        email=user.email,
        name=user.name
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == request.email)).first()

    if user:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        user.reset_token = token_hash
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        session.add(user)
        session.commit()

        reset_link = f"{settings.frontend_url}/reset-password?token={token}"

        if settings.smtp_host:
            print(f"[EMAIL] Reset link for {request.email}: {reset_link}")
        else:
            print(f"[DEV] Reset link for {request.email}: {reset_link}")

    return MessageResponse(message="If email exists, reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, session: Session = Depends(get_session)):
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    user = session.exec(select(User).where(User.reset_token == token_hash)).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.hashed_password = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    session.add(user)
    session.commit()

    return MessageResponse(message="Password has been reset successfully")
