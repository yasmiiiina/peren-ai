from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserUpdate


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_google_user(db: Session, email: str, name: str, google_id: str, picture_url: str | None = None) -> User:
    user = User(email=email, name=name, google_id=google_id, picture_url=picture_url)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_email_user(db: Session, email: str, name: str, password_hash: str, profile_type: str = "individu") -> User:
    user = User(email=email, name=name, password=password_hash, profile_type=profile_type)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_profile(db: Session, user: User, payload: UserUpdate) -> User:
    if payload.name is not None:
        user.name = payload.name
    if payload.profile_type is not None:
        user.profile_type = payload.profile_type
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
