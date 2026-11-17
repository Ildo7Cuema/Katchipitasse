-- Seed de demonstração (não usar em produção com dados reais misturados)
-- Executar apenas em ambientes de desenvolvimento após 001_initial_schema.sql

insert into public.categories (name, description, sort_order) values
  ('Pratos principais', 'Sugestões do chef', 1),
  ('Entradas', 'Para começar', 2),
  ('Bebidas', 'Frescas e naturais', 3)
on conflict (name) do nothing;

insert into public.dishes (category_id, name, description, price, image_url, is_featured)
select c.id, v.name, v.description, v.price, v.image_url, v.is_featured
from (
  values
    ('Pratos principais', 'Muamba de Galinha', 'Galinha estufada com quiabo, dendém e funge.', 4500::numeric, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80', true),
    ('Pratos principais', 'Peixe Grelhado', 'Peixe fresco grelhado com legumes da época.', 5500::numeric, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80', true),
    ('Entradas', 'Salada da Casa', 'Mistura fresca com molho de limão e azeite.', 2500::numeric, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80', false),
    ('Bebidas', 'Sumo Natural', 'Maracujá, manga ou laranja — escolha do dia.', 1200::numeric, 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1200&q=80', false)
) as v(category_name, name, description, price, image_url, is_featured)
join public.categories c on c.name = v.category_name
where not exists (select 1 from public.dishes d where d.name = v.name);

insert into public.rooms (name, description, features, price_per_night, max_guests, image_url, is_featured)
select * from (
  values
    ('Quarto Standard', 'Conforto essencial com vista para o jardim.', 'Wi-Fi, AC, casa de banho privativa, TV', 18000::numeric, 2, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80', true),
    ('Suíte Familiar', 'Espaço amplo para famílias, com área de estar.', 'Wi-Fi, AC, 2 camas, frigobar, varanda', 32000::numeric, 4, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', true),
    ('Quarto Executivo', 'Ambiente sereno para descanso e trabalho.', 'Wi-Fi, AC, secretária, casa de banho privativa', 25000::numeric, 2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', false)
) as v(name, description, features, price_per_night, max_guests, image_url, is_featured)
where not exists (select 1 from public.rooms r where r.name = v.name);

-- Promover admin (substituir o e-mail):
-- update public.profiles set role = 'admin' where email = 'admin@katchiitassi.ao';
