from fastapi import APIRouter

router = APIRouter()

@router.get("/",tags=["greet"], status_code=200)
async def greet():
    return {"message": "welcome to web designer api...🚀"}
