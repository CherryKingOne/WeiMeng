import asyncio
import re
from sqlalchemy import text, select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.script import ScriptLibrary
from app.utils.id_generator import generate_user_id

PATTERN = re.compile(r"^wm\d{9}$")

async def get_column_type(session, table_name, column_name):
    q = text(
        """
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = :table AND column_name = :column
        """
    )
    r = await session.execute(q.bindparams(table=table_name, column=column_name))
    row = r.first()
    return row[0] if row else None

async def get_fk_constraint_name(session, table_name, column_name):
    q = text(
        """
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = :table AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = :column
        """
    )
    r = await session.execute(q.bindparams(table=table_name, column=column_name))
    row = r.first()
    return row[0] if row else None

async def alter_column_to_varchar(session, table, column):
    await session.execute(text(f"ALTER TABLE {table} ALTER COLUMN {column} TYPE varchar(11) USING {column}::text"))

async def drop_constraint(session, table, constraint_name):
    await session.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT {constraint_name}"))

async def add_users_fk(session):
    await session.execute(text("""
        ALTER TABLE script_libraries
        ADD CONSTRAINT script_libraries_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id)
    """))

async def migrate_ids(session):
    fk_name = await get_fk_constraint_name(session, "script_libraries", "user_id")
    if fk_name:
        await drop_constraint(session, "script_libraries", fk_name)
    users_id_type = await get_column_type(session, "users", "id")
    libs_user_id_type = await get_column_type(session, "script_libraries", "user_id")
    if users_id_type != "character varying":
        await alter_column_to_varchar(session, "users", "id")
    if libs_user_id_type != "character varying":
        await alter_column_to_varchar(session, "script_libraries", "user_id")

    result = await session.execute(select(User))
    users = result.scalars().all()

    for user in users:
        old_id = str(user.id)
        if PATTERN.match(old_id):
            continue
        new_id = generate_user_id()
        while (await session.execute(select(User).where(User.id == new_id))).first() is not None:
            new_id = generate_user_id()
        await session.execute(text("UPDATE users SET id = :new_id WHERE id = :old_id").bindparams(new_id=new_id, old_id=old_id))
        await session.execute(text("UPDATE script_libraries SET user_id = :new_id WHERE user_id = :old_id").bindparams(new_id=new_id, old_id=old_id))

    await add_users_fk(session)

async def main():
    async with AsyncSessionLocal() as session:
        await migrate_ids(session)
        await session.commit()
        print("User ID migration completed.")

if __name__ == "__main__":
    asyncio.run(main())
