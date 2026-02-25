from src.modules.auth.domain.entities.user import User
from src.modules.auth.infrastructure.models.user_model import UserModel

class UserMapper:
    @staticmethod
    def to_entity(model: UserModel) -> User:
        return User(
            id=model.id,
            email=model.email,
            username=model.username,
            hashed_password=model.hashed_password,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    @staticmethod
    def to_model(entity: User) -> UserModel:
        return UserModel(
            id=entity.id,
            email=entity.email,
            username=entity.username,
            hashed_password=entity.hashed_password,
            is_active=entity.is_active,
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    @staticmethod
    def update_model_from_entity(model: UserModel, entity: User) -> UserModel:
        model.username = entity.username
        model.hashed_password = entity.hashed_password
        model.is_active = entity.is_active
        model.updated_at = entity.updated_at
        return model
