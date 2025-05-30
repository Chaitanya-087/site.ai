from fastapi import APIRouter

router = APIRouter()

@router.get("/",tags=["greet"], status_code=200)
async def greet():
    return {"message": "welcome to web designer api...🚀"}

@router.get("/ping",tags=["ping"], status_code=200, description="check the readiness of api")
async def ping():
    return {"message": "api is up..🚀"}