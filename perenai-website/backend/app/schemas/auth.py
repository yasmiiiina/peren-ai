from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    profile_type: str = "individu"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
