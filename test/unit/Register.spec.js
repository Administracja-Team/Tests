import { mount } from '@vue/test-utils';
import Register from '@/views/Register.vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';

describe('Register.vue', () => {
  let wrapper;

  beforeEach(() => {
    const app = createApp(Register);
    app.use(PrimeVue);
    app.use(ToastService); 
    wrapper = mount(Register, {
      global: {
        plugins: [PrimeVue, ToastService]
      }
    });
  });

  it('должен отобразить все поля ввода и кнопку регистрации', async () => {
    expect(wrapper.findAll('input').length).toBeGreaterThan(0);
    expect(wrapper.find('button').exists()).toBe(true);
  });
});
