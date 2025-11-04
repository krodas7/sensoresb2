"""
Configuración de Auditlog para rastrear cambios en modelos
"""
from auditlog.registry import auditlog
from apps.cupping.models import Cupping, CuppingSample, CuppingScore, Cupper, CommercialCupping
from apps.lots.models import Lot
from apps.fermentation.models import FermentationBatch
from apps.employees.models import Employee
from apps.attendance.models import Attendance
from apps.areas.models import Area
from apps.sensors.models import Sensor
from apps.temperatures.models import Temperature
from apps.occupation.models import Occupation
from apps.core.models import User, Alert, Event, Parameter

# Registrar modelos para auditlog
auditlog.register(User)
auditlog.register(Alert)
auditlog.register(Event)
auditlog.register(Parameter)

# Catación
auditlog.register(Cupping)
auditlog.register(CuppingSample)
auditlog.register(CuppingScore)
auditlog.register(Cupper)
auditlog.register(CommercialCupping)

# Lotes y Fermentación
auditlog.register(Lot)
auditlog.register(FermentationBatch)

# Empleados y Asistencia
auditlog.register(Employee)
auditlog.register(Attendance)

# Áreas y Sensores
auditlog.register(Area)
auditlog.register(Sensor)
auditlog.register(Temperature)
auditlog.register(Occupation)


