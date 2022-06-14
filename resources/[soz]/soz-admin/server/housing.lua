---
--- Properties
---
QBCore.Functions.CreateCallback("admin:housing:server:GetProperties", function(source, cb)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    cb(MySQL.query.await("SELECT * FROM housing_property"))
end)

QBCore.Functions.CreateCallback("admin:housing:server:GetApartments", function(source, cb, propertyId)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    cb(MySQL.query.await("SELECT * FROM housing_apartment WHERE property_id = ?", {propertyId}))
end)

QBCore.Functions.CreateCallback("admin:server:housing:CreateProperty", function(source, cb, name)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    if name == nil then
        return
    end

    cb(MySQL.query.await("INSERT INTO housing_property (identifier) VALUES (?)", {name}))
end)

RegisterNetEvent("admin:server:housing:UpdatePropertyZone", function(id, zone_type, zone_config)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    exports["soz-housing"]:UpdatePropertyZone(id, zone_type, zone_config)
end)

QBCore.Functions.CreateCallback("admin:server:housing:SetApartmentIdentifier", function(source, cb, propertyId, apartmentId, identifier)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    exports["soz-housing"]:SetApartmentIdentifier(propertyId, apartmentId, identifier)
    cb(true)
end)

QBCore.Functions.CreateCallback("admin:server:housing:SetApartmentLabel", function(source, cb, propertyId, apartmentId, label)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    exports["soz-housing"]:SetApartmentLabel(propertyId, apartmentId, label)
    cb(true)
end)

QBCore.Functions.CreateCallback("admin:server:housing:SetApartmentInsideCoord", function(source, cb, propertyId, apartmentId, coord)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    exports["soz-housing"]:SetApartmentInsideCoord(propertyId, apartmentId, coord)
    cb(true)
end)

RegisterNetEvent("admin:server:housing:UpdateApartmentZone", function(propertyId, apartmentId, zone_type, zone_config)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    exports["soz-housing"]:UpdateApartmentZone(propertyId, apartmentId, zone_type, zone_config)
end)

QBCore.Functions.CreateCallback("admin:server:housing:CreateApartment", function(source, cb, propertyId, identifier, label)
    if not SozAdmin.Functions.IsPlayerHelper(source) then
        return
    end

    if propertyId == nil or identifier == nil or label == nil then
        return
    end

    cb(MySQL.query.await("INSERT INTO housing_apartment (property_id, identifier, label) VALUES (?, ?, ?)", {
        propertyId,
        identifier,
        label,
    }))
end)