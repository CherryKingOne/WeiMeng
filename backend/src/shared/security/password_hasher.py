import bcrypt
import hashlib

class PasswordHasher:
    @staticmethod
    def _pre_hash_password(password: str) -> bytes:
        digest = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return digest.encode('utf-8')

    @staticmethod
    def hash(password: str) -> str:
        password_bytes = PasswordHasher._pre_hash_password(password)
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        return hashed.decode('utf-8')

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        if not plain_password or not hashed_password:
            return False
        
        try:
            password_bytes = PasswordHasher._pre_hash_password(plain_password)
            
            if isinstance(hashed_password, str):
                hashed_bytes = hashed_password.encode('utf-8')
            else:
                hashed_bytes = hashed_password
                
            return bcrypt.checkpw(password_bytes, hashed_bytes)
        except (ValueError, TypeError):
            return False

password_hasher = PasswordHasher()
