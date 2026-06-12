# ---- build stage ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY FlowSight.Api/FlowSight.Api.csproj FlowSight.Api/
RUN dotnet restore FlowSight.Api/FlowSight.Api.csproj
COPY . .
RUN dotnet publish FlowSight.Api/FlowSight.Api.csproj -c Release -o /app

# ---- runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "FlowSight.Api.dll"]
